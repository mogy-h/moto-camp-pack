// ログイン・新規登録のあとに戻す先。招待リンク（/j/トークン）だけを許可し、それ以外はダッシュボードへ。
// next は URL に入っていて誰でも書き換えられるので、外のサイトへ飛ばされないよう（オープンリダイレクト）、形が完全に一致したときだけ使う
const INVITE_PATH = /^\/j\/[A-Za-z0-9_-]+$/;

// URL の searchParams（string | string[] | undefined）と formData.get（string | File | null）の両方から呼ぶので unknown で受ける
export function safeNextPath(value: unknown): string {
  if (typeof value === "string" && INVITE_PATH.test(value)) return value;
  return "/";
}
