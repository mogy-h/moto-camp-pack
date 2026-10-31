"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireMember } from "@/lib/session";
import { updateEventGearMemoSchema } from "@/lib/validation/schemas";
import { type ActionResult, ok, toFailure } from "@/lib/action-result";

export async function updateEventGearMemo(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 入力の検証
    const input = updateEventGearMemoSchema.parse({
      eventId: formData.get("eventId"),
      gearMemo: formData.get("gearMemo"),
    });
    // ② 参加しているか確かめ、自分の EventMember を取る
    const me = await requireMember(input.eventId);
    // ③ 自分の EventMember の gearMemo を更新する
    await prisma.eventMember.update({
      where: { id: me.id },
      data: { gearMemo: input.gearMemo },
    });
    // ④ イベント詳細を再検証
    revalidatePath(`/events/${input.eventId}`);
    return ok();
  } catch (error) {
    return toFailure(error);
  }
}
