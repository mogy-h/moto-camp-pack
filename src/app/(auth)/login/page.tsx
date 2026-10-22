import type { Metadata } from "next";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = {
  title: "ログイン | MotoCamp Pack",
};

export default function LoginPage() {
  return (
    <>
      {/* 見出しは目に見えるタブと重なるので、読み上げ用にだけ置く */}
      <h1 className="sr-only">ログイン</h1>
      <AuthTabs current="/login" />
      <SignInForm />
    </>
  );
}
