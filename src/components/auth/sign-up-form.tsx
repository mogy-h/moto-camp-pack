"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { useState, useActionState } from "react";
import { signUp } from "@/actions/auth";
import { type ActionResult } from "@/lib/action-result";

const initialState: ActionResult = { ok: true, data: undefined };

// 新規登録のフォーム。見た目は Claude、Server Action とつなぐ部分（TODO）は本人が書く
export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const errorMessage = state.ok ? undefined : state.error;

  return (
    // noValidate: ブラウザ標準のチェック（吹き出し）を止め、エラーの表示を zod の日本語のメッセージにそろえる
    <form action={formAction} noValidate className="flex flex-col gap-3.5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="displayName">表示名</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="nickname"
          placeholder="山田 太郎"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
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
          autoComplete="new-password"
          placeholder="8文字以上"
        />
      </div>
      <div className="flex items-start gap-2.5">
        {/* Checkbox の初期の見た目は「積み込み済み」の丸いチェック。ここはデザインに合わせて角の丸い四角にする。
            name を付けると、Radix が隠れた input を出力し、チェックされていれば "on" が送られる */}
        <Checkbox
          id="agreedToTerms"
          name="agreedToTerms"
          className="mt-0.5 size-5 rounded-sm bg-neutral-100 text-neutral-100 data-checked:border-accent-600 data-checked:bg-accent-600 [&_svg]:size-3"
          checked={agreedToTerms}
          onCheckedChange={(value) => setAgreedToTerms(value === true)}
        />
        <Label
          htmlFor="agreedToTerms"
          className="block text-xs leading-relaxed font-normal"
        >
          {/* 新しいタブで開く（同じタブで開くと、入力途中のフォームが消えるため） */}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-accent-700 underline underline-offset-2"
          >
            利用規約とプライバシーポリシー
          </Link>
          に同意します
        </Label>
      </div>
      <Button
        disabled={isPending}
        type="submit"
        className="mt-1 h-11.5 w-full text-base"
      >
        アカウントを作成
      </Button>
      <FormError message={errorMessage} />
    </form>
  );
}
