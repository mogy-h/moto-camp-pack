import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock,
  LogIn,
  MapPin,
  Motorbike,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { JoinForm } from "@/components/join/join-form";

// 招待リンクの画面（/j/[token]）の部品。どの状態を出すかはページが決め、ここは受け取った値を並べるだけにする

type InviteEvent = {
  title: string;
  place: string | null;
  startDate: Date;
  endDate: Date;
};

// プロフィールの表示名・バイク・積載装備メモ（id はアバターの色に使う）
type ProfileUser = {
  id: string;
  displayName: string;
  bike: string | null;
  gearMemo: string | null;
};

// date 列は Prisma が UTC 0 時の Date で返すので、UTC のまま表示する（event-card.tsx と同じ考え方）
const monthFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  timeZone: "UTC",
});
const dayFormat = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  timeZone: "UTC",
});
const weekdayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
const dayWithWeekdayFormat = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  weekday: "short",
  timeZone: "UTC",
});

const DAY_MS = 24 * 60 * 60 * 1000;

// 「10/12(土) 〜 10/13(日)・1泊2日」。日帰りは「10/12(土)・日帰り」
function formatRange(startDate: Date, endDate: Date): string {
  const start = dayWithWeekdayFormat.format(startDate);
  const nights = Math.round((endDate.getTime() - startDate.getTime()) / DAY_MS);
  if (nights === 0) return `${start}・日帰り`;
  return `${start} 〜 ${dayWithWeekdayFormat.format(endDate)}・${nights}泊${nights + 1}日`;
}

// 「SEROW 250・リアキャリア＋40Lシートバッグ」。どちらも未登録なら空文字
function profileLine(user: ProfileUser): string {
  return [user.bike, user.gearMemo].filter(Boolean).join("・");
}

// 背景・ロゴ・幅。(auth) のレイアウトとはロゴの大きさとキャッチコピーの有無が違うので、別に作る
function JoinFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center bg-[radial-gradient(120%_55%_at_50%_0%,var(--color-neutral-100)_0%,var(--color-bg)_62%)] px-3 pt-4 pb-13.5 sm:px-5.5 sm:pt-9">
      <div className="w-full max-w-100">
        <div className="mb-4 flex items-center justify-center gap-2 sm:mb-6">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-sm bg-accent-600 text-neutral-100">
            <Motorbike strokeWidth={2.75} className="size-3.5" />
          </span>
          <span className="font-display text-base text-accent-700">
            MotoCamp Pack
          </span>
        </div>
        {children}
      </div>
    </main>
  );
}

type InviteCardProps = {
  hostName: string; // 招待リンクを発行した人の表示名
  event: InviteEvent;
  members: { id: string; displayName: string }[]; // 参加中のメンバー（User の id と表示名）
  progress: { packed: number; total: number };
  children: React.ReactNode; // 下半分（参加方法・参加ボタンなど）
};

// 使える招待リンクのカード。上半分にイベントの概要、下半分に children を出す
function InviteCard({
  hostName,
  event,
  members,
  progress,
  children,
}: InviteCardProps) {
  return (
    <div className="rounded-xl bg-accent-200/55 px-2 pt-1.5 pb-2">
      <p className="px-2.5 pt-2.75 pb-3 text-center text-xs leading-relaxed text-accent-800">
        <strong className="font-bold">{hostName}</strong>{" "}
        さんから招待が届きました
      </p>

      <div className="overflow-hidden rounded-lg border bg-surface shadow-md">
        <div className="border-b p-4 sm:p-5.5">
          <div className="flex items-start gap-3.25">
            {/* 日付ボックス（出発日）。ダッシュボードのイベントカードと同じ形 */}
            <div className="flex w-13 shrink-0 flex-col items-center gap-px rounded-md bg-accent-600 py-2 text-neutral-100">
              <span className="text-2xs font-semibold tracking-[0.08em] opacity-85">
                {monthFormat.format(event.startDate).toUpperCase()}
              </span>
              <span className="text-2xl leading-none font-bold tabular-nums">
                {dayFormat.format(event.startDate)}
              </span>
              <span className="text-2xs opacity-85">
                {weekdayFormat.format(event.startDate).toUpperCase()}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-base leading-normal text-pretty sm:text-lg">
                {event.title}
              </h1>
              {event.place && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-700">
                  <MapPin strokeWidth={2.75} className="size-3 shrink-0" />
                  <span className="min-w-0 truncate">{event.place}</span>
                </p>
              )}
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-700">
                <CalendarDays strokeWidth={2.75} className="size-3 shrink-0" />
                {formatRange(event.startDate, event.endDate)}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex items-center gap-2 border-t pt-3.5">
            <AvatarStack users={members} max={4} />
            {/* デザインは「共同装備 32点」だが、進捗は貸し借りの品目も数える（ヘッダーの積み込みと同じ値）ので「装備」にする */}
            <p className="min-w-0 flex-1 text-xs leading-relaxed text-neutral-700">
              {members.length}名が参加中・装備 {progress.total}点のうち{" "}
              {progress.packed}点が積み込み済み
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5.5">{children}</div>
      </div>
    </div>
  );
}

// 未ログイン: ログインか新規登録を選ぶ。ゲスト参加は #18 では出さない（デザインの「アカウントなしで参加」は省く）。
// ログイン後にこのページへ戻すため、next にこのページの URL を付ける（⑥でログイン・新規登録が next を読むようにする）
function LoginChoices({ token }: { token: string }) {
  const next = encodeURIComponent(`/j/${token}`);
  const routes = [
    {
      href: `/login?next=${next}`,
      icon: LogIn,
      title: "アカウントでログインして参加",
      description: "プロフィールのバイク・積載装備をそのまま使えます",
    },
    {
      href: `/signup?next=${next}`,
      icon: UserPlus,
      title: "アカウントを作って参加",
      description: "メールアドレスで登録してから参加します",
    },
  ];

  return (
    <div>
      <h2 className="mb-1.5 text-base">参加方法を選んでください</h2>
      <p className="mb-3.5 text-xs leading-relaxed text-neutral-700">
        参加するには、アカウントでのログインが必要です。
      </p>
      <div className="flex flex-col gap-2.25">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="flex w-full items-center gap-3 rounded-md border border-neutral-300 bg-surface p-3.25 text-neutral-900 transition-colors hover:border-accent-500"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-2-100 text-accent-2-800">
              <route.icon strokeWidth={2.75} className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm leading-snug font-bold">
                {route.title}
              </span>
              <span className="mt-0.5 block text-2xs leading-relaxed font-medium text-neutral-700">
                {route.description}
              </span>
            </span>
            <ChevronRight
              strokeWidth={2.75}
              className="size-3.5 shrink-0 text-neutral-600"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ログイン済みで、まだ参加していない: このアカウントで参加する。
// デザインの「別の名前でゲスト参加」は、ゲスト参加を出さないので省く
function AccountPanel({ user, token }: { user: ProfileUser; token: string }) {
  const line = profileLine(user);

  return (
    <div>
      <h2 className="mb-3 text-base">このアカウントで参加しますか？</h2>
      <div className="mb-3.25 flex items-center gap-2.5 rounded-md border border-accent-2-200 bg-accent-2-100 px-3.25 py-3">
        <Avatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-bold">{user.displayName}</p>
          {line && (
            <p className="mt-0.5 truncate text-2xs text-accent-2-800">{line}</p>
          )}
        </div>
      </div>
      <JoinForm token={token} />
    </div>
  );
}

// 参加中: イベントを開く。
// デザインの「担当装備 6点（うち貸し出し 2点）」は数えるクエリが増えるので、プロフィールの1行にする。
// 「別のアカウントで参加し直す」はゲスト参加がないので省く
function JoinedPanel({
  user,
  eventId,
}: {
  user: ProfileUser;
  eventId: string;
}) {
  const line = profileLine(user);

  return (
    <div>
      <div className="mb-3.25 flex items-center gap-2.5 rounded-md border border-accent-200 bg-accent-100 px-3.25 py-3">
        <Avatar user={user} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug font-bold">
            {user.displayName} さんとして参加中
          </p>
          {line && (
            <p className="mt-0.5 truncate text-2xs text-accent-800">{line}</p>
          )}
        </div>
      </div>
      <Button asChild className="h-11.5 w-full text-base">
        <Link href={`/events/${eventId}`}>イベントを開く</Link>
      </Button>
    </div>
  );
}

// 使えない招待リンク（見つからない・無効・期限切れ）。どれかは区別しない（トークンを総当たりで探られても手がかりを与えない）。
// イベントの概要も出さない。行き先の「/」は、未ログインなら proxy がログイン画面へ回す
function InvalidInvite({ loggedIn }: { loggedIn: boolean }) {
  return (
    <div className="rounded-lg border bg-surface px-5 pt-6 pb-5 text-center shadow-md">
      <div className="mx-auto mb-3.25 flex size-12 items-center justify-center rounded-full bg-neutral-200 text-neutral-700">
        <Clock strokeWidth={2.75} className="size-6" />
      </div>
      <h1 className="mb-2 text-base">この招待リンクは使えません</h1>
      <p className="mx-auto mb-4 max-w-68 text-xs leading-loose text-neutral-700">
        有効期限が切れているか、主催者によって無効化されました。主催者に新しいリンクをリクエストしてください。
      </p>
      <Button asChild variant="secondary" className="px-5">
        <Link href="/">
          {loggedIn ? "ダッシュボードへ" : "ログインして確認する"}
        </Link>
      </Button>
    </div>
  );
}

export {
  JoinFrame,
  InviteCard,
  LoginChoices,
  AccountPanel,
  JoinedPanel,
  InvalidInvite,
};
