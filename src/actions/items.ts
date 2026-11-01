"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { notifyOthers } from "@/lib/notify";
import {
  addSharedItemSchema,
  deleteItemSchema,
} from "@/lib/validation/schemas";
import { assertCan } from "@/lib/permissions";
import { NotFoundError } from "@/lib/errors";

import { type ActionResult, ok, toFailure } from "@/lib/action-result";

export async function addSharedItem(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = addSharedItemSchema.parse({
      eventId: formData.get("eventId"),
      name: formData.get("name"),
      size: formData.get("size"),
    });
    // ② 参加しているか確かめ、自分の EventMember を取る。
    // 共同装備の追加は参加者なら誰でもできるので、assertCan は呼ばない
    const me = await requireMember(input.eventId);
    // ③ アイテムと通知を同じトランザクションで作る（実装ルール 5）
    await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          eventId: input.eventId,
          kind: "SHARED",
          name: input.name,
          size: input.size,
          createdById: me.id,
        },
      });

      await notifyOthers(tx, {
        eventId: input.eventId,
        actorId: me.id,
        type: "SHARED_ADDED",
        itemId: item.id,
      });
    });
    // ④ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}

export async function deleteItem(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = deleteItemSchema.parse({
      eventId: formData.get("eventId"),
      itemId: formData.get("itemId"),
    });

    // ② 参加しているか確かめ、自分の EventMember を取る
    const me = await requireMember(input.eventId);

    // ③ 権限の判定に使う値を取る
    const item = await prisma.item.findFirst({
      where: { id: input.itemId, eventId: input.eventId, kind: "SHARED" },
      select: { createdById: true, requesterId: true },
    });
    if (item === null) throw new NotFoundError();

    // ④ 登録者でなければ ForbiddenError を投げる
    assertCan("deleteItem", { id: me.id }, item);

    // ⑤ 削除する。このアイテムの通知は、外部キーの Cascade で DB が一緒に消す
    await prisma.item.delete({
      where: { id: input.itemId },
    });

    // ⑥ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}
