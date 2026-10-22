"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { useState, useActionState } from "react";
import { signIn } from "@/actions/auth";
import { type ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true, data: undefined };

// ログインのフォーム。見た目は Claude、Server Action とつなぐ部分（TODO）は本人が書く
export function SignInForm() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);
  const [email, setEmail] = useState("");

  const errorMessage = state.ok ? undefined : state.error;

  return (
    // noValidate: ブラウザ標準のチェック（吹き出し）を止め、エラーの表示を zod の日本語のメッセージにそろえる
    <form action={formAction} noValidate className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">パスワード</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          placeholder="8文字以上"
        />
      </div>
      <Button
        disabled={isPending}
        type="submit"
        className="mt-1 h-11.5 w-full text-base"
      >
        ログイン
      </Button>
      <FormError message={errorMessage} />
    </form>
  );
}
