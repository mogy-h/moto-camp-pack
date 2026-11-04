"use client";

import { Button } from "@/components/ui/button";
import { type ActionResult } from "@/lib/action-result";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const initialState: ActionResult = { ok: true, data: undefined };

// Button の props（variant・size・className・aria-label・children など）はそのまま受け取る。
// type は submit に固定するので外から渡させない
type ItemActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "type"
> & {
  // items.ts の Action。formData の eventId / itemId を読む
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  eventId: string;
  itemId: string;
};

// アイテム1件に対する操作のボタン（自分が運ぶ・降りる・積み込み済み）。
// 成功したら revalidatePath で行が変わるので、知らせるのは失敗のときだけ
function ItemActionButton({
  action,
  eventId,
  itemId,
  ...buttonProps
}: ItemActionButtonProps) {
  const router = useRouter();
  const [, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await action(prev, formData);
      if (!result.ok) {
        toast.error(result.error);
        router.refresh();
      }
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex shrink-0">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="itemId" value={itemId} />
      <Button type="submit" disabled={isPending} {...buttonProps} />
    </form>
  );
}

export { ItemActionButton };
