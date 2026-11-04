import type { Metadata } from "next";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { SignInForm } from "@/components/auth/sign-in-form";
import { safeNextPath } from "@/lib/next-path";

export const metadata: Metadata = {
  title: "ログイン | MotoCamp Pack",
};

export default async function LoginPage(props: PageProps<"/login">) {
  // ?next= があれば、ログイン後にそこへ戻す（招待リンクだけ。それ以外は "/"）
  const { next } = await props.searchParams;
  const nextPath = safeNextPath(next);

  return (
    <>
      {/* 見出しは目に見えるタブと重なるので、読み上げ用にだけ置く */}
      <h1 className="sr-only">ログイン</h1>
      <AuthTabs current="/login" next={nextPath} />
      <SignInForm next={nextPath} />
    </>
  );
}
