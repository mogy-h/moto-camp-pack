"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { type ActionResult } from "@/lib/action-result";
import { useActionState } from "react";
import { joinWithAccount } from "@/actions/invites";

const initialState: ActionResult = { ok: true, data: undefined };

// 「このアカウントで参加する」。成功すると joinWithAccount がイベント詳細へ redirect するので、ここでは失敗だけ表示する。
// 入力欄の name（token）は、joinWithAccount が formData.get で読む名前と一致させる
function JoinForm({ token }: { token: string }) {
  // TODO(本人): useActionState で joinWithAccount につなぐ
  const [state, formAction, isPending] = useActionState(
    joinWithAccount,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <FormError message={state.ok ? undefined : state.error} />
      <Button
        type="submit"
        disabled={isPending}
        className="h-11.5 w-full text-base"
      >
        このアカウントで参加する
      </Button>
    </form>
  );
}

export { JoinForm };
