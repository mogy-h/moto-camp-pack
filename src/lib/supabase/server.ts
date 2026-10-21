import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase Auth 用のクライアント。DB の読み書きは Prisma で行い、ここからは Auth（登録・ログイン・セッション）だけを呼ぶ。
// セッションは Cookie に入っていて、リクエストごとに違う。使い回すと別の人のセッションが混ざるので、使うたびに作る
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Cookie を書けるのは Server Action と Route Handler だけで、Server Component から呼ぶと例外になる。
        // セッションの更新は proxy.ts で毎回行うので、ここで書けなくても困らない（Supabase のガイドと同じ扱い）
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {}
      },
    },
  });
}
