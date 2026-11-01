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
import { deleteItem } from "@/actions/items";
import { type ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true, data: undefined };

type DeleteItemDialogProps = {
  eventId: string;
  itemId: string;
  itemName: string;
  carrierName: string | undefined; // 運搬担当の表示名（いれば、確認の文で知らせる）
};

// 行のゴミ箱ボタンと、削除の確認モーダル
function DeleteItemDialog({
  eventId,
  itemId,
  itemName,
  carrierName,
}: DeleteItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* デザインの行の操作ボタンはグレー。ghost のオレンジを className で上書きする */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${itemName}を削除`}
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
        <DialogDescription className="mb-3.25 text-xs leading-relaxed text-neutral-700">
          リストから削除します。元に戻せません。
          {carrierName && `運搬担当の${carrierName}さんには通知されません。`}
        </DialogDescription>

        <DeleteItemForm
          eventId={eventId}
          itemId={itemId}
          onDeleted={() => {
            setOpen(false);
            toast.success("リストから削除しました");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// 入力欄の name（eventId / itemId）は、deleteItem が formData.get で読む名前と一致させる
function DeleteItemForm({
  eventId,
  itemId,
  onDeleted,
}: {
  eventId: string;
  itemId: string;
  onDeleted: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await deleteItem(prev, formData);
      if (result.ok) onDeleted();
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
        <Button type="submit" variant="destructive" className="flex-1" disabled={isPending}>
          リストから削除
        </Button>
      </div>
    </form>
  );
}

export { DeleteItemDialog };
