import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ページを表示する前に、毎回のリクエストで動く。やることは2つ:
// 1. セッションの更新（Server Component は Cookie を書けないので、期限が近いトークンの入れ替えはここで行う）
// 2. 未ログイン時のリダイレクト（案内だけ。本当のチェックは Server Component・Server Action の getCurrentUser() で行う）

// ログイン画面。ログイン済みの人が開いたらダッシュボードへ移す
const AUTH_PAGES = ["/login", "/signup"];

// ログインしていなくても開けるページ。/j/... は招待リンク（アカウントを持っていない人も開く。#18）
function isPublicPath(pathname: string) {
  return AUTH_PAGES.includes(pathname) || pathname.startsWith("/j/");
}

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY が設定されていません",
    );
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      // トークンを入れ替えたときに呼ばれる。新しい Cookie を、このあと表示するページ（request）と
      // ブラウザへ返す応答（response）の両方に書く。ページ側は request の Cookie を読むので、両方に要る
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Cookie を書いた応答を CDN にキャッシュさせない（別の人にセッションが渡るのを防ぐ）
        Object.entries(headers).forEach(([name, value]) =>
          response.headers.set(name, value),
        );
      },
    },
  });

  // createServerClient と getClaims の間に処理を挟まない（Supabase のガイドの注意。挟むとセッションが更新されないことがある）。
  // getClaims は Cookie のトークンの署名を確かめてから中身を返すので、偽の Cookie ではログイン済みにならない
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (isLoggedIn && AUTH_PAGES.includes(pathname)) {
    return redirectTo("/", request, response);
  }
  if (!isLoggedIn && !isPublicPath(pathname)) {
    return redirectTo("/login", request, response);
  }
  return response;
}

// リダイレクトの応答にも、入れ替えたセッションの Cookie を写す（写さないと、更新したトークンが失われる）
function redirectTo(
  pathname: string,
  request: NextRequest,
  response: NextResponse,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

// 画像・CSS・JS などには proxy を通さない（通すと、未ログインのときにログイン画面の CSS まで /login へ飛ばされる）
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
