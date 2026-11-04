"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember, getMember, requireUser } from "@/lib/session";
import { assertOwner } from "@/lib/permissions";
import { createInviteSchema, joinInviteSchema } from "@/lib/validation/schemas";
import { toDateString } from "@/lib/date";
import { type ActionResult, ok, toFailure } from "@/lib/action-result";
import { AppError } from "@/lib/errors";
import { redirect } from "next/navigation";
import { inviteStatus } from "@/lib/derive/inviteStatus";
import { notifyOthers } from "@/lib/notify";

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
    // ⑤ 推測できないトークンで招待を作る（実装ルール 10）。期限は出発日の終わり（日本時間）
    await prisma.invite.create({
      data: {
        eventId: input.eventId,
        token: randomBytes(24).toString("base64url"),
        createdById: me.id,
        expiresAt: expiresAt,
      },
    });

    // ⑥ イベント詳細を再検証（モーダルの中身がリンクの表示に変わる）
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}

// 招待リンクから参加する（新規・再参加を兼ねる）。成功したらイベント詳細へ移る
export async function joinWithAccount(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  // ① 未ログインなら /login へ（redirect は例外を投げて動くので try の外。auth.ts と同じ）
  const user = await requireUser();

  // redirect も try の外で呼ぶので、行き先の eventId は外で宣言しておく
  let eventId: string;
  try {
    const input = joinInviteSchema.parse({ token: formData.get("token") });

    // ② トークンで招待を引き、使えるか確かめる
    const invite = await prisma.invite.findUnique({
      where: { token: input.token },
      select: { id: true, eventId: true, revokedAt: true, expiresAt: true },
    });
    if (invite === null || inviteStatus(invite, new Date()) !== "valid") {
      throw new AppError("この招待リンクは使えません");
    }
    eventId = invite.eventId;

    // ③ 参加中なら何もしない（参加通知が二重に出ないように）
    const current = await getMember(eventId);
    if (current === null) {
      // ④ 参加（再参加なら同じ行の leftAt を null に戻す）と通知を同じトランザクションで（実装ルール 5・11）
      await prisma.$transaction(async (tx) => {
        const member = await tx.eventMember.upsert({
          where: {
            eventId_userId: { eventId: invite.eventId, userId: user.id },
          },
          update: { leftAt: null, invitedVia: invite.id },
          create: {
            eventId: invite.eventId,
            userId: user.id,
            isGuest: false,
            invitedVia: invite.id,
          },
        });
        await notifyOthers(tx, {
          eventId: invite.eventId,
          actorId: member.id, // notify.tsで自分を除くようになっている
          type: "MEMBER_JOINED",
        });
      });
    }
  } catch (error) {
    return toFailure(error);
  }
  redirect(`/events/${eventId}`);
}
