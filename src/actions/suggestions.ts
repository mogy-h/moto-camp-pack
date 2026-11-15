"use server";

import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import {
  suggestSharedItemsSchema,
  type Suggestion,
} from "@/lib/validation/schemas";
import { toDateString } from "@/lib/date";
import { AppError } from "@/lib/errors";
import { type ActionResult, ok, toFailure } from "@/lib/action-result";
import { buildSuggestPrompt, MAX_SUGGESTIONS } from "@/lib/suggest/prompt";
import { fetchGeminiSuggestions } from "@/lib/suggest/gemini";
import { PRESET_SUGGESTIONS } from "@/lib/suggest/presets";
import { excludeExisting } from "@/lib/suggest/exclude-existing";

// 1人あたりの回数制限（直近24時間で10回まで）。前払いの残高を、1人の連打で使い切られないようにする
const SUGGEST_LIMIT = 10;
const SUGGEST_WINDOW_MS = 24 * 60 * 60 * 1000;

export type SuggestionsData = {
  source: "ai" | "preset"; // 画面で「定番のリストから表示しています」を出すかどうかに使う
  suggestions: Suggestion[];
};

// 足りない共同装備の候補を返す（登録はしない。登録は候補の「追加」から addSharedItem で行う）
// _prev の null は「まだ一度も押していない」（画面の useActionState の初期値）
export async function suggestSharedItems(
  _prev: ActionResult<SuggestionsData> | null,
  formData: FormData,
): Promise<ActionResult<SuggestionsData>> {
  try {
    // ① 入力の検証
    const input = suggestSharedItemsSchema.parse({
      eventId: formData.get("eventId"),
    });

    // ② 参加しているか確かめ、自分の EventMember を取る（参加者なら誰でも使えるので、assertCan は呼ばない）
    const me = await requireMember(input.eventId);

    // ③ この人が直近24時間に呼んだ回数を数え、上限以上なら止める。
    //    同時に押すと上限を1〜2回超えることがあるが、費用の上限は前払いの残高で守られているので、厳密にはしない
    const since = new Date(Date.now() - SUGGEST_WINDOW_MS);
    const count = await prisma.suggestionLog.count({
      where: {
        userId: me.userId,
        createdAt: { gte: since },
      },
    });

    if (count >= SUGGEST_LIMIT)
      throw new AppError(
        `AI の提案は24時間で${SUGGEST_LIMIT}回までです。時間をおいて、もう一度お試しください`,
      );

    // ④ 呼んだ記録を残す。Gemini を呼ぶ前に残すのは、失敗やタイムアウトのときでも料金がかかることがあるため
    await prisma.suggestionLog.create({
      data: { userId: me.userId },
    });

    // ⑤ プロンプトに入れる値を読む（参加中なので、イベントは必ずある）
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: input.eventId },
      select: {
        place: true,
        startDate: true,
        endDate: true,
        items: { where: { kind: "SHARED" }, select: { name: true } }, // 登録済みの共同装備の名前
        _count: { select: { members: { where: { leftAt: null } } } }, // 参加中の人数
      },
    });
    const existingNames = event.items.map((item) => item.name);

    const prompt = buildSuggestPrompt({
      place: event.place,
      startDate: toDateString(event.startDate),
      endDate: toDateString(event.endDate),
      memberCount: event._count.members,
      existingNames,
    });

    // ⑥ Gemini に聞く。失敗したら定番リストにする。
    //    ここで捕まえるのは Gemini 側の失敗だけ（①〜⑤ の失敗は外側の catch に行き、エラーとして画面に出る）
    let source: SuggestionsData["source"];
    let candidates: Suggestion[];

    try {
      candidates = await fetchGeminiSuggestions(prompt);
      source = "ai";
    } catch (error) {
      console.error(error);
      candidates = PRESET_SUGGESTIONS;
      source = "preset";
    }

    // ⑦ 登録済みと重複を除いて MAX_SUGGESTIONS 件にし、返す。
    //    revalidatePath は呼ばない（④ のログは画面に出さないので、表示は変わらない）
    const suggestions = excludeExisting(
      candidates,
      existingNames,
      MAX_SUGGESTIONS,
    );
    return ok({ source, suggestions });
  } catch (error) {
    return toFailure(error);
  }
}
