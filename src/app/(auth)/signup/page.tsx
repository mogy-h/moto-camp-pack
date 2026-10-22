import type { Metadata } from "next";
import { AuthTabs } from "@/components/auth/auth-tabs";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "新規登録 | MotoCamp Pack",
};

export default function SignupPage() {
  return (
    <>
      {/* 見出しは目に見えるタブと重なるので、読み上げ用にだけ置く */}
      <h1 className="sr-only">新規登録</h1>
      <AuthTabs current="/signup" />
      <SignUpForm />
    </>
  );
}
