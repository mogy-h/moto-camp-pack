"use client";

import { useState, useActionState } from "react";
import { CornerUpLeft } from "lucide-react";
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
import { requestRental } from "@/actions/items";
import { type ActionResult } from "@/lib/action-result";

const SIZES = ["S", "M", "L"] as const;
const initialState: ActionResult = { ok: true, data: undefined };

// 「借りたいギアをリクエスト」ボタンと、ギア名・かさばり具合を入力するモーダル。
// 宛先（貸してくれる人）の選択は #16 で足すので、ここで作るリクエストはいつも「貸せる人を募集中」になる
function RequestRentalDialog({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* デザインは枠線だけのオレンジのボタン（塗りつぶしの「共同装備を追加」と区別する） */}
        <Button
          size="sm"
          variant="secondary"
          className="border-accent-500 text-xs text-accent-700 hover:bg-accent-200 aria-expanded:bg-accent-200"
        >
          <CornerUpLeft strokeWidth={2.75} className="size-3.5" />
          借りたいギアをリクエスト
        </Button>
      </DialogTrigger>

      <DialogContent className="gap-0 sm:max-w-100">
        <DialogTitle className="mb-3.25">借りたいギアをリクエスト</DialogTitle>

        {/* 閉じると中身が消えるので、開くたびに空のフォームから始まる（AddSharedItemDialog と同じ） */}
        <RequestRentalForm
          eventId={eventId}
          onRequested={() => {
            setOpen(false);
            toast.success("リクエストしました");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// 入力欄の name（eventId / name / size）は、requestRental が formData.get で読む名前と一致させる
function RequestRentalForm({
  eventId,
  onRequested,
}: {
  eventId: string;
  onRequested: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await requestRental(prev, formData);
      if (result.ok) onRequested();
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
        <Label htmlFor="rental-name">ギア名</Label>
        <Input
          id="rental-name"
          name="name"
          placeholder="例：ヘキサタープ"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        {/* ラジオボタンの集まりには for で結びつけられないので、aria-labelledby で見出しを読み上げる */}
        <Label asChild id="rental-size-label">
          <span>かさばり具合（運ぶ人の判断材料）</span>
        </Label>
        <RadioGroup
          name="size"
          aria-labelledby="rental-size-label"
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

      {/* デザインの「指定しない場合は」は、宛先を選べる #16 の文言なので省いた */}
      <DialogDescription className="text-xs leading-relaxed text-neutral-700">
        募集中になり、最初に「自分が貸す」を押した人に決まります。運搬は貸す人のバイクです。
      </DialogDescription>

      <FormError message={state.ok ? undefined : state.error} />
      <div className="mt-1.5 flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="px-4.5">
            キャンセル
          </Button>
        </DialogClose>
        <Button type="submit" className="flex-1" disabled={isPending}>
          リクエストする
        </Button>
      </div>
    </form>
  );
}

export { RequestRentalDialog };
