import "server-only";
import type { NotifType, Prisma } from "@/generated/prisma/client";

type NotifyOthersInput = {
  eventId: string;
  actorId: string; // 操作した本人の EventMember の id（本人には通知しない）
  type: NotifType;
  itemId: string;
};

// 操作した本人以外の参加者全員に、同じ通知を1件ずつ作る。
// 更新と同じトランザクションで作るので（実装ルール 5）、prisma ではなく tx を受け取る
export async function notifyOthers(
  tx: Prisma.TransactionClient,
  input: NotifyOthersInput,
) {
  // ① 宛先を調べる
  const recipients = await tx.eventMember.findMany({
    where: {
      eventId: input.eventId,
      leftAt: null,
      id: { not: input.actorId }, // 自分を除く
    },
    select: { id: true },
  });

  // ② 宛先の人数分の通知をまとめて作る
  await tx.notification.createMany({
    data: recipients.map((recipient) => ({
      eventId: input.eventId,
      recipientId: recipient.id,
      type: input.type,
      actorId: input.actorId,
      itemId: input.itemId,
    })),
  });
}
