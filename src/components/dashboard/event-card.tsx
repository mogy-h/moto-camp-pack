import Link from "next/link";
import { MapPin } from "lucide-react";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EventPhase = "upcoming" | "draft" | "done";

// 導出値（状態・進捗）は使う側で計算して渡す。カードは受け取った値を並べるだけにする
type EventCardProps = {
  event: {
    id: string;
    title: string;
    place: string | null;
    startDate: Date;
    endDate: Date;
  };
  phase: EventPhase;
  // 参加中のメンバー（並び順は渡された順のまま）
  members: { id: string; displayName: string }[];
  progress: { packed: number; total: number; ratio: number };
};

const PHASE_BADGE = {
  upcoming: { label: "準備中", variant: "accent" },
  draft: { label: "下書き", variant: "neutral" },
  done: { label: "完了", variant: "accent-2" },
} as const;

// 出発日・帰着日は date 列（Prisma は UTC 0 時の Date で返す）なので、UTC のまま表示する。
// 日本時間で表示すると 9 時間ずれるだけで日付は変わらないが、date 列の扱いを lib/date.ts とそろえておく
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
const monthDayFormat = new Intl.DateTimeFormat("ja-JP", {
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

// 「10/12 – 10/13」。日帰り（出発日と帰着日が同じ）は「10/25」だけ
function formatRange(startDate: Date, endDate: Date): string {
  const start = monthDayFormat.format(startDate);
  const end = monthDayFormat.format(endDate);
  return start === end ? start : `${start} – ${end}`;
}

function EventCard({ event, phase, members, progress }: EventCardProps) {
  const done = phase === "done";
  const badge = PHASE_BADGE[phase];
  const complete = progress.ratio === 1;

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "block rounded-lg border bg-surface p-3.25 shadow-sm transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4",
        done && "opacity-72",
      )}
    >
      <div className="flex flex-wrap items-start gap-2.75 sm:gap-4">
        {/* 日付ボックス（出発日） */}
        <div
          className={cn(
            "flex w-14 shrink-0 flex-col items-center gap-px rounded-md py-2",
            done
              ? "bg-neutral-300 text-neutral-800"
              : "bg-accent-600 text-neutral-100",
          )}
        >
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

        {/* 状態・期間・タイトル・場所 */}
        <div className="min-w-0 flex-1 basis-50">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
            <span className="text-xs text-neutral-600">
              {formatRange(event.startDate, event.endDate)}
            </span>
          </div>
          <h2
            className={cn(
              "text-base leading-normal font-medium text-pretty sm:text-lg",
              done && "line-through decoration-neutral-400",
            )}
          >
            {event.title}
          </h2>
          {event.place && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-700">
              <MapPin strokeWidth={2.75} className="size-3 shrink-0" />
              <span className="min-w-0 truncate">{event.place}</span>
            </p>
          )}
        </div>

        {/* メンバー・積み込みの進捗 */}
        <div className="flex min-w-34 shrink-0 flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <AvatarStack users={members} max={4} />
            <span className="text-xs whitespace-nowrap text-neutral-700">
              {members.length}名
            </span>
          </div>
          <div>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-2xs text-neutral-700">積み込み</span>
              <span className="text-xs font-bold text-neutral-800 tabular-nums">
                {progress.packed} / {progress.total}
              </span>
            </div>
            {/* 数は上の「18 / 32」で読み上げられるので、バーは飾りとして読み上げから外す。
                幅は値によって変わるので、Tailwind のクラスではなく style で渡す */}
            <div
              aria-hidden
              className="h-1.5 overflow-hidden rounded-full bg-neutral-300"
            >
              <div
                className={cn(
                  "h-full rounded-full",
                  complete ? "bg-accent-2-600" : "bg-accent-500",
                )}
                style={{ width: `${progress.ratio * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export { EventCard, type EventPhase };
