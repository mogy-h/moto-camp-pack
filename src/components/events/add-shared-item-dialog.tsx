"use client";

import { useState, useActionState } from "react";
import { Plus } from "lucide-react";
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
import { addSharedItem } from "@/actions/items";
import { type ActionResult } from "@/lib/action-result";
import { ItemFields } from "@/components/events/item-fields";

const initialState: ActionResult = { ok: true, data: undefined };

// 「共同装備を追加」ボタンと、ギア名・かさばり具合を入力するモーダル
function AddSharedItemDialog({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="text-xs">
          <Plus strokeWidth={2.75} className="size-3.5" />
          共同装備を追加
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 sm:max-w-100">
        <DialogTitle className="mb-3.25">共同装備を追加</DialogTitle>

        {/* 閉じると中身が消えるので、開くたびに空のフォームから始まる（CreateEventDialog と同じ） */}
        <AddSharedItemForm
          eventId={eventId}
          onAdded={() => {
            setOpen(false);
            toast.success("共同装備を追加しました");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// 入力欄の name（eventId / name / size）は、addSharedItem が formData.get で読む名前と一致させる
function AddSharedItemForm({
  eventId,
  onAdded,
}: {
  eventId: string;
  onAdded: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await addSharedItem(prev, formData);
      if (result.ok) onAdded();
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />

      <ItemFields />

      <DialogDescription className="text-xs leading-relaxed text-neutral-700">
        最初に「自分が運ぶ」を押したメンバーが担当になります。
      </DialogDescription>

      <FormError message={state.ok ? undefined : state.error} />
      <div className="mt-1.5 flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="px-4.5">
            キャンセル
          </Button>
        </DialogClose>
        <Button type="submit" className="flex-1" disabled={isPending}>
          リストに追加
        </Button>
      </div>
    </form>
  );
}

export { AddSharedItemDialog };
