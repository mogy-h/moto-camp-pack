import type { Metadata } from "next";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { safeNextPath } from "@/lib/next-path";

export const metadata: Metadata = {
  title: "新規登録 | MotoCamp Pack",
};

export default async function SignupPage(props: PageProps<"/signup">) {
  // ?next= があれば、ログイン後にそこへ戻す（招待リンクだけ。それ以外は "/"）
  const { next } = await props.searchParams;
  const nextPath = safeNextPath(next);

  return (
    <>
      {/* 見出しは目に見えるタブと重なるので、読み上げ用にだけ置く */}
      <h1 className="sr-only">新規登録</h1>
      <AuthTabs current="/signup" next={nextPath} />
      <SignUpForm next={nextPath} />
    </>
  );
}
