export const AVATAR_COLORS = [
  "bg-accent-600 text-accent-100",
  "bg-accent-2-600 text-accent-2-100",
  "bg-neutral-700 text-neutral-100",
  "bg-accent-2-700 text-neutral-100",
  "bg-accent-500 text-neutral-100",
] as const;

type AvatarColor = (typeof AVATAR_COLORS)[number];

export function avatarColor(userId: string): AvatarColor {
  // ① 各文字の文字コードを足し合わせる
  let charCodeSum = 0;
  for (const char of userId) {
    charCodeSum += char.charCodeAt(0);
  }

  // ② パレットの数で割った余りを番号にする
  const index = charCodeSum % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}
