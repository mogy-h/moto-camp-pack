"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { assertOwner } from "@/lib/permissions";
import { createInviteSchema } from "@/lib/validation/schemas";
import { toDateString } from "@/lib/date";
import { type ActionResult, ok, toFailure } from "@/lib/action-result";
import { AppError } from "@/lib/errors";

export async function createInvite(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = createInviteSchema.parse({
      eventId: formData.get("eventId"),
    });

    // ② 参加しているか確かめ、オーナーでなければ ForbiddenError を投げる
    const me = await requireMember(input.eventId);
    assertOwner(me);

    // ③ 期限を決めるために出発日を読む（参加中なので、イベントは必ずある）
    const event = await prisma.event.findUniqueOrThrow({
      where: { id: input.eventId },
      select: { startDate: true },
    });

    // ④ 招待の期限は出発日の終わり（日本時間）まで。過ぎていたらエラー
    const expiresAt = new Date(
        `${toDateString(event.startDate)}T23:59:59+09:00`,
    );
    if (expiresAt <= new Date()) {
        throw new AppError("出発日を過ぎたイベントには招待できません");
    }
    // ④ 推測できないトークンで招待を作る（実装ルール 10）。期限は出発日の終わり（日本時間）
    await prisma.invite.create({
      data: {
        eventId: input.eventId,
        token: randomBytes(24).toString("base64url"),
        createdById: me.id,
        expiresAt: expiresAt,
      },
    });

    // ⑤ イベント詳細を再検証（モーダルの中身がリンクの表示に変わる）
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}
