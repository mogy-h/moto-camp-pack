"use client";

import { useState, useActionState } from "react";
import { Link2, UserPlus } from "lucide-react";
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
import { type ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";
import { createInvite } from "@/actions/invites";

const initialState: ActionResult = { ok: true, data: undefined };

type InviteDialogProps = {
  eventId: string;
  token: string | null; // 使える招待リンクのトークン。なければ null（発行ボタンを出す）
};

// ヘッダーの「招待」ボタンと、招待リンクのモーダル。ボタンはオーナーにだけ出す（検証は createInvite の assertOwner）
function InviteDialog({ eventId, token }: InviteDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="font-medium">
          <UserPlus strokeWidth={2.75} className="size-3.75" />
          招待
        </Button>
      </DialogTrigger>

      {/* デザインは右上の × ではなく、下の「閉じる」ボタンで閉じる */}
      <DialogContent showCloseButton={false} className="gap-0 sm:max-w-105">
        <DialogTitle className="mb-1.5">メンバーを招待</DialogTitle>
        <DialogDescription className="mb-3.25 text-sm leading-relaxed text-neutral-800">
          このリンクを共有すると、参加者が自分のバイクと積載装備を登録して、貸し借り・共同装備の分担に参加できます。
        </DialogDescription>

        {token === null ? (
          <IssueInviteForm eventId={eventId} />
        ) : (
          <InviteLink token={token} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// 招待リンクの表示とコピー。モーダルの中身は開いたときにだけブラウザで描画されるので、window を使える
function InviteLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/j/${token}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // クリップボードは https か localhost でしか使えない。使えなければ手で選んでもらう
      toast.error("コピーできませんでした。リンクを選択してコピーしてください");
    }
  }

  return (
    <>
      <div className="mb-3.25 flex items-center gap-2 rounded-full bg-surface px-3.5 py-2.75">
        <Link2
          strokeWidth={2.75}
          className="size-3.5 shrink-0 text-neutral-700"
        />
        {/* select-all: タップ1回で全体を選べる（コピーできなかったときの手段） */}
        <span className="min-w-0 flex-1 truncate text-xs text-neutral-800 select-all">
          {url}
        </span>
      </div>
      <div className="flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="px-4.5">
            閉じる
          </Button>
        </DialogClose>
        <Button
          type="button"
          onClick={copy}
          aria-live="polite"
          className={cn(
            "flex-1",
            copied && "bg-accent-2-600 hover:bg-accent-2-700",
          )}
        >
          {copied ? "コピーしました" : "リンクをコピー"}
        </Button>
      </div>
    </>
  );
}

// 使える招待リンクがないときの発行ボタン。
// 発行すると createInvite の revalidatePath でページが読み直され、token が渡ってリンクの表示に変わる
// 入力欄の name（eventId）は、createInvite が formData.get で読む名前と一致させる
function IssueInviteForm({ eventId }: { eventId: string }) {
  const [state, formAction, isPending] = useActionState(
    createInvite,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="eventId" value={eventId} />
      <p className="text-xs leading-relaxed text-neutral-700">
        招待リンクはまだ発行されていません。リンクは出発日の終わりまで使えます。
      </p>
      <FormError message={state.ok ? undefined : state.error} />
      <div className="flex gap-2">
        <DialogClose asChild>
          <Button type="button" variant="secondary" className="px-4.5">
            閉じる
          </Button>
        </DialogClose>
        <Button type="submit" className="flex-1" disabled={isPending}>
          招待リンクを発行
        </Button>
      </div>
    </form>
  );
}

export { InviteDialog };
