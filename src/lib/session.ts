import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { JwtPayload } from "@supabase/supabase-js";
import { LIMITS } from "@/lib/validation/limits";

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

  return prisma.user.upsert({
    where: { authUid },
    update: {},
    create: { authUid, displayName },
  });
});
