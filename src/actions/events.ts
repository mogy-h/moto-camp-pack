"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { fromDateString, todayInTokyo } from "@/lib/date";
import { createEventSchema } from "@/lib/validation/schemas";
import { type ActionResult, ok, toFailure } from "@/lib/action-result";

export async function createEvent(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // ① ログイン中のユーザーを取る（try の外）
  const user = await requireUser();
  try {
    // ② 入力の検証
    const input = createEventSchema(todayInTokyo()).parse({
      title: formData.get("title"),
      place: formData.get("place"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      bike: formData.get("bike"),
      gearMemo: formData.get("gearMemo"),
    });
    // ③ $transaction の中で、イベント（＋自分を OWNER として参加）を作り、車種をプロフィールに保存
    await prisma.$transaction(async (tx) => {
      // イベントを作る。members.create で、同じイベントの EventMember（自分）も一緒に作れる
      await tx.event.create({
        data: {
          title: input.title,
          place: input.place,
          startDate: fromDateString(input.startDate), // date 列は文字列ではなく Date で渡す
          endDate: fromDateString(input.endDate),
          createdById: user.id,
          members: {
            create: {
              userId: user.id,
              role: "OWNER",
              gearMemo: input.gearMemo,
            },
          },
        },
      });

      // 車種をプロフィール（User.bike）に保存する
      await tx.user.update({
        where: { id: user.id },
        data: { bike: input.bike },
      });
    });
    revalidatePath("/");

    // ④ ダッシュボードを再検証
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}
