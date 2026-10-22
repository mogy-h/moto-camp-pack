"use client";

import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";

// ログインのフォーム。見た目は Claude、Server Action とつなぐ部分（TODO）は本人が書く
export function SignInForm() {
  // TODO（本人）: useActionState で signIn（src/actions/auth.ts）とつなぐ
  // TODO（本人）: メールアドレスを useState で持ち、Input を value / onChange にする（送信のたびに空に戻らないように）

  return (
    // noValidate: ブラウザ標準のチェック（吹き出し）を止め、エラーの表示を zod の日本語のメッセージにそろえる
    <form noValidate className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
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
      {/* TODO（本人）: 送信中は disabled にする */}
      <Button type="submit" className="mt-1 h-11.5 w-full text-base">
        ログイン
      </Button>
      {/* TODO（本人）: Action が { ok: false } を返したら、error を渡して表示する */}
      <FormError />
    </form>
  );
}
