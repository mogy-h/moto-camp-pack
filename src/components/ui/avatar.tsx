import { avatarColor } from "@/lib/derive/avatarColor";
import { initials } from "@/lib/derive/initials";
import { cn } from "@/lib/utils";

// 表示に使うのは id（色）と表示名（イニシャル）だけ。Prisma の User 型に縛られないよう、必要な形だけ受け取る
type AvatarUser = { id: string; displayName: string };

// デザインで使われている大きさ: sm = 品目の担当（24px）、md = アバター列（30px）、lg = メンバーカード（42px）。
// leading-none は文字の大きさのあとに書く（text-* は行の高さも決めるので、cn が前にある leading-* を消してしまう）
const SIZES = {
  sm: "size-5.5 text-2xs leading-none",
  md: "size-7 text-2xs leading-none",
  lg: "size-9.5 text-xs leading-none",
} as const;

type AvatarSize = keyof typeof SIZES;

const CIRCLE =
  "inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none";

// 画像は使わず、イニシャルと色だけで表す（shadcn の Avatar は画像を出す部品なので使わない）。
// 読み上げではイニシャル（「佐々」）ではなく表示名を読むよう、role="img" と aria-label を付ける
function Avatar({
  user,
  size = "md",
  className,
}: {
  user: AvatarUser;
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={user.displayName}
      title={user.displayName}
      className={cn(CIRCLE, SIZES[size], avatarColor(user.id), className)}
    >
      {initials(user.displayName)}
    </span>
  );
}

// 先頭から max 人を並べ、残りは「+2」のようにまとめる（ダッシュボードのイベントカードは最大4人）。
// 並び順は渡された順のまま（参加順などは使う側で決める）
function AvatarStack({
  users,
  max = 4,
  size = "md",
  className,
}: {
  users: AvatarUser[];
  max?: number;
  size?: AvatarSize;
  className?: string;
}) {
  const shown = users.slice(0, max);
  const rest = users.length - shown.length;

  return (
    <div className={cn("flex gap-1", className)}>
      {shown.map((user) => (
        <Avatar key={user.id} user={user} size={size} />
      ))}
      {rest > 0 && (
        <span
          role="img"
          aria-label={`ほか${rest}名`}
          className={cn(CIRCLE, SIZES[size], "bg-neutral-200 text-neutral-800")}
        >
          +{rest}
        </span>
      )}
    </div>
  );
}

export { Avatar, AvatarStack };
