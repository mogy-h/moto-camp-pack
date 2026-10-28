import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@supabase/supabase-js";
import { LIMITS } from "@/lib/validation/limits";
import { redirect } from "next/navigation";
import { fields } from "@/lib/validation/schemas";
import { NotMemberError } from "@/lib/errors";

const FALLBACK_DISPLAY_NAME = "名無しさん";

// 新規登録の画面で入れた表示名を使う。万が一使えなければ仮の名前にする
function displayNameFrom(claims: JwtPayload): string {
  const name = claims.user_metadata?.display_name;

  if (typeof name !== "string") return FALLBACK_DISPLAY_NAME;

  const trimmedName = name.trim();
  if (trimmedName === "") return FALLBACK_DISPLAY_NAME;

  return Array.from(trimmedName).slice(0, LIMITS.displayName).join("");
}

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError) {
    console.error(claimsError); //Vercel のログで見られる
    return null;
  }
  if (!data) return null; // 未ログイン

  const authUid = data.claims.sub;
  const displayName = displayNameFrom(data.claims);
  const email = data.claims.email ?? null;

  const user = await prisma.user.upsert({
    where: { authUid },
    update: {},
    create: { authUid, displayName },
  });

  return { ...user, email };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (user === null) return redirect("/login");
  return user;
}

// このイベントに参加中（leftAt が null）なら EventMember を、そうでなければ null を返す。画面用（null なら notFound()）
export const getMember = cache(async (eventId: string) => {
  const user = await getCurrentUser();
  if (user === null) return null;

  // URL の eventId が uuid の形でないと、DB がエラーを投げる（404 ではなくエラー画面になる）ため、先に弾く
  if (!fields.id.safeParse(eventId).success) return null;

  const member = await prisma.eventMember.findFirst({
    where: {
      eventId,
      userId: user.id,
      leftAt: null,
    },
  });
  return member;
});

// Server Action 用。参加していなければ NotMemberError（try の中で呼ぶ）
export async function requireMember(eventId: string) {
  const member = await getMember(eventId);
  if (member === null) throw new NotMemberError();
  return member;
}
