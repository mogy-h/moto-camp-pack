"use client";

import { useState, useActionState } from "react";
import { Pencil } from "lucide-react";
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
import { ItemFields } from "@/components/events/item-fields";
import { updateItem } from "@/actions/items";
import { type ActionResult } from "@/lib/action-result";
import type { BoardItem } from "@/components/events/types";

const initialState: ActionResult = { ok: true, data: undefined };

type EditItemDialogProps = {
  eventId: string;
  item: BoardItem; // id・kind・name・size を使う
  carrierName: string | undefined; // 担当の表示名（いれば、通知されないことを知らせる）
};

// 行の鉛筆ボタンと、ギア名・かさばり具合を直すモーダル（共同装備・貸し借りで共通）
function EditItemDialog({ eventId, item, carrierName }: EditItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* ゴミ箱（DeleteItemDialog）と同じグレーのボタン */}
        <Button
          variant="ghost"
          size="icon"
          aria-label={`${item.name}を編集`}
          className="text-neutral-600 hover:bg-neutral-200 hover:text-text"
        >
          <Pencil strokeWidth={2.75} className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 sm:max-w-100">
        <DialogTitle className="mb-3.25">
          {item.kind === "RENTAL" ? "リクエストを編集" : "共同装備を編集"}
        </DialogTitle>

        <EditItemForm
          eventId={eventId}
          item={item}
          carrierName={carrierName}
          onSaved={() => {
            setOpen(false);
            toast.success("変更を保存しました");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// 入力欄の name（eventId / itemId / name / size）は、updateItem が formData.get で読む名前と一致させる
function EditItemForm({
  eventId,
  item,
  carrierName,
  onSaved,
}: {
  eventId: string;
  item: BoardItem;
  carrierName: string | undefined;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await updateItem(prev, formData);
      if (result.ok) onSaved();
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="itemId" value={item.id} />
      <input type="hidden" name="eventId" value={eventId} />

      <ItemFields defaultName={item.name} defaultSize={item.size} />

      <DialogDescription className="text-xs leading-relaxed text-neutral-700">
        ギア名とかさばり具合を変更します。
        {carrierName && `担当の${carrierName}さんには通知されません。`}
      </DialogDescription>

      <FormError message={state.ok ? undefined : state.error} />
      <div className="mt-1.5 flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="px-4.5">
            キャンセル
          </Button>
        </DialogClose>
        <Button type="submit" className="flex-1" disabled={isPending}>
          変更を保存
        </Button>
      </div>
    </form>
  );
}

export { EditItemDialog };
