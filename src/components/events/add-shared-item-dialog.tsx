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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SIZE_LABEL } from "@/components/events/item-parts";
import { FormError } from "@/components/ui/form-error";
import { addSharedItem } from "@/actions/items";
import { type ActionResult } from "@/lib/action-result";

const SIZES = ["S", "M", "L"] as const;
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

  // React 19 は送信後にフォームを空に戻すので、エラーのときに入力が消えないよう state で持つ
  const [name, setName] = useState("");
  const [size, setSize] = useState("M");

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-name">ギア名</Label>
        <Input
          id="item-name"
          name="name"
          placeholder="例：ヘキサタープ"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {/* ラジオボタンの集まりには for で結びつけられないので、aria-labelledby で見出しを読み上げる */}
        <Label asChild id="item-size-label">
          <span>かさばり具合（運ぶ人の判断材料）</span>
        </Label>
        <RadioGroup
          name="size"
          aria-labelledby="item-size-label"
          value={size}
          onValueChange={setSize}
        >
          {SIZES.map((value) => (
            <RadioGroupItem key={value} value={value}>
              {SIZE_LABEL[value]}
            </RadioGroupItem>
          ))}
        </RadioGroup>
      </div>

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
