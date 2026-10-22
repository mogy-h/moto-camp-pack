"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { signUpSchema, signInSchema } from "@/lib/validation/schemas";
import { type ActionResult, toFailure } from "@/lib/action-result";
import { AppError } from "@/lib/errors";

// useActionState から呼ぶので、第1引数に「前回の結果」が入る（今回は使わないので _ を付ける）
export async function signUp(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    // ① 検証
    const input = signUpSchema.parse({
      displayName: formData.get("displayName"),
      email: formData.get("email"),
      password: formData.get("password"),
      agreedToTerms: formData.get("agreedToTerms") === "on", // チェックボックスは、チェックされると "on" が届く
    });

    // ② supabase.auth.signUp で Auth のアカウントを作る。
    //    options.data に { display_name: ... } を入れる（getCurrentUser が読む場所）
    const supabase = await createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { display_name: input.displayName }, // ここが user_metadata になる
      },
    });
    // ③ error があれば AppError を投げる（error.code で見分けて、日本語の文言にする）
    if (signUpError) {
      if (signUpError.code === "user_already_exists") {
        throw new AppError("このメールアドレスは登録済みです");
      }
      if (signUpError.code === "weak_password") {
        throw new AppError("パスワードが短すぎるか、簡単すぎます");
      }
      if (signUpError.code === "over_request_rate_limit") {
        throw new AppError("しばらく時間をおいてから、もう一度お試しください");
      }

      throw signUpError;
    }
    // ④ prisma.user.create で User を作る（authUid は ② で返る data.user.id）
    if (!data.user) {
      throw new Error("Supabase Auth からユーザーが返りませんでした");
    }
    await prisma.user.create({
      data: {
        authUid: data.user.id,
        displayName: input.displayName,
      },
    });
  } catch (error) {
    return toFailure(error);
  }
  redirect("/"); // ★ try の外に書く
}

export async function signIn(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const input = signInSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });

    if (signInError) {
      if (signInError.code === "invalid_credentials") {
        throw new AppError("メールアドレスまたはパスワードが違います");
      }
      if (signInError.code === "over_request_rate_limit") {
        throw new AppError("しばらく時間をおいてから、もう一度お試しください");
      }
      throw signInError;
    }
  } catch (error) {
    return toFailure(error);
  }
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
