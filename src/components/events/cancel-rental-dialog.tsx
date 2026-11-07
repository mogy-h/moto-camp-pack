"use client";

import { useState, useActionState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormError } from "@/components/ui/form-error";
import { cancelRental } from "@/actions/items";
import { type ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true, data: undefined };

type CancelRentalDialogProps = {
  eventId: string;
  itemId: string;
  itemName: string;
  carrierName: string | undefined; // 貸す人の表示名（いれば、担当もなくなることを確認の文で知らせる）
};

// 借り手の行のゴミ箱ボタンと、取り下げの確認モーダル（DeleteItemDialog と同じ形）
function CancelRentalDialog({
  eventId,
  itemId,
  itemName,
  carrierName,
}: CancelRentalDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* デザインの行の操作ボタンはグレー。ghost のオレンジを className で上書きする */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${itemName}のリクエストを取り下げる`}
          className="text-neutral-600 hover:bg-neutral-200 hover:text-text"
        >
          <Trash2 strokeWidth={2.75} className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 sm:max-w-82">
        <p className="mb-0.5 text-2xs text-neutral-600">アイテムの操作</p>
        {/* pr-7: 長い名前が右上の閉じるボタンに重ならないようにする */}
        <DialogTitle className="mb-1.5 pr-7 text-pretty wrap-anywhere">
          {itemName}
        </DialogTitle>
        {/* 共同装備の削除と違い、全員に通知が届く（REQUEST_CANCELLED） */}
        <DialogDescription className="mb-3.25 text-xs leading-relaxed text-neutral-700">
          リクエストを取り下げます。元に戻せません。ほかのメンバーに通知されます。
          {carrierName &&
            `貸す予定だった${carrierName}さんの担当もなくなります。`}
        </DialogDescription>

        <CancelRentalForm
          eventId={eventId}
          itemId={itemId}
          onCancelled={() => {
            setOpen(false);
            toast.success("リクエストを取り下げました");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// 入力欄の name（eventId / itemId）は、cancelRental が formData.get で読む名前と一致させる
function CancelRentalForm({
  eventId,
  itemId,
  onCancelled,
}: {
  eventId: string;
  itemId: string;
  onCancelled: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await cancelRental(prev, formData);
      if (result.ok) onCancelled();
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="itemId" value={itemId} />

      <FormError message={state.ok ? undefined : state.error} />
      <div className="flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="px-4.5">
            キャンセル
          </Button>
        </DialogClose>
        <Button
          type="submit"
          variant="destructive"
          className="flex-1"
          disabled={isPending}
        >
          取り下げる
        </Button>
      </div>
    </form>
  );
}

export { CancelRentalDialog };
