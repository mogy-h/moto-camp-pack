"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { notifyOthers } from "@/lib/notify";
import {
  addSharedItemSchema,
  itemTargetSchema,
  requestRentalSchema,
} from "@/lib/validation/schemas";
import { assertCan } from "@/lib/permissions";
import { NotFoundError, AlreadyTakenError } from "@/lib/errors";

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
    const input = itemTargetSchema.parse({
      eventId: formData.get("eventId"),
      itemId: formData.get("itemId"),
    });

    // ② 参加しているか確かめ、自分の EventMember を取る
    const me = await requireMember(input.eventId);

    // ③ 権限の判定に使う値を取る
    const item = await prisma.item.findFirst({
      where: { id: input.itemId, eventId: input.eventId, kind: "SHARED" },
      select: { createdById: true, requesterId: true, carrierId: true },
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

export async function carrySharedItem(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = itemTargetSchema.parse({
      eventId: formData.get("eventId"),
      itemId: formData.get("itemId"),
    });

    // ② 参加しているか確かめ、自分の EventMember を取る。
    // assertCan は呼ばない（先に読むと read-then-write になる。自分の id しか入れないので、他の人を指名できない）
    const me = await requireMember(input.eventId);

    // ③ 担当がまだいないときだけ、自分を担当にする（実装ルール 4）
    const { count } = await prisma.item.updateMany({
      where: {
        id: input.itemId,
        eventId: input.eventId,
        kind: "SHARED",
        carrierId: null,
      },
      data: { carrierId: me.id, acceptedAt: new Date() },
    });

    // ④ 1件も更新されなければ、先に他の人が担当になっている
    if (count === 0) throw new AlreadyTakenError();

    // ⑤ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}

export async function withdrawCarrier(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = itemTargetSchema.parse({
      eventId: formData.get("eventId"),
      itemId: formData.get("itemId"),
    });

    // ② 参加しているか確かめ、自分の EventMember を取る
    const me = await requireMember(input.eventId);

    // ③ 権限の判定に使う値を取る。貸し借りでも同じ Action を使うので（#15）、kind は条件に入れない
    const item = await prisma.item.findFirst({
      where: { id: input.itemId, eventId: input.eventId },
      select: { createdById: true, requesterId: true, carrierId: true },
    });
    if (item === null) throw new NotFoundError();

    // ④ 担当本人でなければ ForbiddenError を投げる
    assertCan("withdrawCarrier", { id: me.id }, item);

    // ⑤ 担当を外す更新と通知を、同じトランザクションで行う（実装ルール 5）
    await prisma.$transaction(async (tx) => {
      await tx.item.update({
        where: { id: input.itemId },
        data: { carrierId: null, acceptedAt: null, packedAt: null }, // 3つの列を null に戻す
      });
      await notifyOthers(tx, {
        eventId: input.eventId,
        actorId: me.id,
        type: "WITHDRAWN",
        itemId: input.itemId,
        payload: { reason: "self" }, // 自分で降りたことを示す
      });
    });

    // ⑥ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}

export async function togglePacked(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = itemTargetSchema.parse({
      eventId: formData.get("eventId"),
      itemId: formData.get("itemId"),
    });

    // ② 参加しているか確かめ、自分の EventMember を取る
    const me = await requireMember(input.eventId);

    // ③ 権限の判定に使う値と、今の積み込みの状態を取る。貸し借りでも使うので（#15）、kind は条件に入れない
    const item = await prisma.item.findFirst({
      where: { id: input.itemId, eventId: input.eventId },
      select: {
        createdById: true,
        requesterId: true,
        carrierId: true,
        packedAt: true,
      },
    });
    if (item === null) throw new NotFoundError();

    // ④ 担当本人でなければ ForbiddenError を投げる
    assertCan("togglePacked", { id: me.id }, item);

    // ⑤ 今と逆の状態にする。通知は作らず書き込みも1回なので、トランザクションは使わない
    await prisma.item.update({
      where: { id: input.itemId },
      data: { packedAt: item.packedAt === null ? new Date() : null },
    });

    // ⑥ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}

// 借りたいギアのリクエスト（宛先なしの募集）。参加者なら誰でも作れる
export async function requestRental(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = requestRentalSchema.parse({
      eventId: formData.get("eventId"),
      name: formData.get("name"),
      size: formData.get("size"),
    });
    // ② 参加しているか確かめ、自分の EventMember を取る（assertCan は呼ばない。addSharedItem と同じ理由）
    const me = await requireMember(input.eventId);
    // ③ アイテムを作る
    await prisma.item.create({
      data: {
        eventId: input.eventId,
        kind: "RENTAL",
        name: input.name,
        size: input.size,
        createdById: me.id,
        requesterId: me.id, // 自分がリクエストしたことを示す
      },
    });
    // ④ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}

// 募集中のリクエストに「自分が貸す」（早い者勝ち）。借り手に ACCEPTED を知らせる
export async function offerRental(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = itemTargetSchema.parse({
      eventId: formData.get("eventId"),
      itemId: formData.get("itemId"),
    });

    // ② 参加しているか確かめ、自分の EventMember を取る（assertCan は呼ばない。carrySharedItem と同じ理由）
    const me = await requireMember(input.eventId);

    // ③ 更新と通知を、同じトランザクションで行う（実装ルール 5）
    await prisma.$transaction(async (tx) => {
      // 貸す人がまだいなくて、自分の募集でないときだけ、自分を貸す人にする（実装ルール 4）
      const { count } = await tx.item.updateMany({
        where: {
          id: input.itemId,
          eventId: input.eventId,
          kind: "RENTAL",
          carrierId: null,
          requesterId: { not: me.id }, // 自分の募集には自分で貸せない
        },
        data: { carrierId: me.id, acceptedAt: new Date() },
      });
      // 1件も更新されなければ AlreadyTakenError（carrySharedItem と同じ1行）
      if (count === 0) throw new AlreadyTakenError();

      // 通知の宛先（借り手）を読む
      const item = await tx.item.findUniqueOrThrow({
        where: { id: input.itemId },
        select: { requesterId: true },
      });
      // 型は string | null。貸し借りでは CHECK 制約で必ず入っているが、TypeScript はそれを知らないので確かめる
      if (item.requesterId === null)
        throw new Error("借り手のいない貸し借りです");

      // 借り手1人だけに知らせる（notifyOthers は「本人以外の全員」宛てなので使わない）
      await tx.notification.create({
        data: {
          eventId: input.eventId,
          recipientId: item.requesterId,
          type: "ACCEPTED",
          actorId: me.id,
          itemId: input.itemId,
        },
      });
    });

    // ④ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}
