"use client";

import { useActionState, useState } from "react";
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
import { GearMemoInput } from "@/components/ui/gear-memo-input";
import { FormError } from "@/components/ui/form-error";
import { updateEventGearMemo } from "@/actions/members";
import { type ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true, data: undefined };

type GearMemoDialogProps = {
  eventId: string;
  title: string; // 見出し（「山田 拓也・SEROW 250」）
  memo: string | null; // 今の実効メモ（入力欄の初期値）
  children: React.ReactNode; // モーダルを開くボタン（自分のカードのメモのチップ）
};

// 自分の積載装備メモ（このイベントの EventMember.gearMemo）を編集するモーダル
function GearMemoDialog({
  eventId,
  title,
  memo,
  children,
}: GearMemoDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="gap-0 sm:max-w-91">
        <p className="mb-0.5 text-2xs text-neutral-600">積載装備のメモ</p>
        <DialogTitle className="mb-1.5">{title}</DialogTitle>
        <DialogDescription className="mb-2.75 text-xs leading-relaxed text-neutral-700">
          キャリアやバッグの構成を書いておくと、他のメンバーが「誰に頼めそうか」を判断しやすくなります。枠数や上限は設定しません。
        </DialogDescription>

        {/* 閉じると中身が消えるので、開くたびに今のメモから始まる（CreateEventDialog と同じ） */}
        <GearMemoForm
          eventId={eventId}
          memo={memo}
          onSaved={() => {
            setOpen(false);
            toast.success("積載装備のメモを保存しました");
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

// 入力欄の name（eventId / gearMemo）は、updateEventGearMemo が formData.get で読む名前と一致させる
function GearMemoForm({
  eventId,
  memo,
  onSaved,
}: {
  eventId: string;
  memo: string | null;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: ActionResult, formData: FormData) => {
      const result = await updateEventGearMemo(prev, formData);
      if (result.ok) onSaved();
      return result;
    },
    initialState,
  );

  const [gearMemo, setGearMemo] = useState(memo ?? "");

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      {/* どのイベントのメモか。画面に出さずにフォームと一緒に送る（サーバー側で uuid か・参加しているかを確かめる） */}
      <input type="hidden" name="eventId" value={eventId} />
      <GearMemoInput
        name="gearMemo"
        aria-label="積載装備のメモ"
        placeholder="例：リアキャリア＋40Lシートバッグ、サイドバッグなし"
        value={gearMemo}
        onChange={setGearMemo}
      />

      <FormError message={state.ok ? undefined : state.error} />
      <div className="mt-1.5 flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="px-4.5">
            キャンセル
          </Button>
        </DialogClose>
        <Button disabled={isPending} type="submit" className="flex-1">
          保存する
        </Button>
      </div>
    </form>
  );
}

export { GearMemoDialog };
