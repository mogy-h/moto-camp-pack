import { Motorbike } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GearMemoDialog } from "@/components/events/gear-memo-dialog";
import { cn } from "@/lib/utils";
import type { BoardMember } from "@/components/events/types";

type MemberCardProps = {
  eventId: string;
  member: BoardMember;
  selected: boolean;
  onSelect: () => void;
};

// カードを押すと、下のリストをこのメンバーの担当分で絞り込む。
// 自分のカードにはメモの編集ボタンを置くので、カード自体は button にしない（button の中に button は置けない）。
// 代わりに名前の button の ::after をカード全体に広げ、どこを押しても絞り込めるようにする
function MemberCard({ eventId, member, selected, onSelect }: MemberCardProps) {
  const { confirmedCount, askingCount } = member;
  const memoLabel =
    member.gearMemo ?? (member.isSelf ? "積載装備を登録" : "積載装備は未登録");
  const memoChipClass = cn(
    "inline-flex h-7 min-w-0 flex-auto items-center gap-1.5 rounded-full border px-2.75 text-xs transition-colors",
    member.gearMemo
      ? "border-divider text-neutral-800"
      : "border-dashed border-neutral-400 text-neutral-700",
  );

  return (
    <div
      className={cn(
        "relative rounded-lg border-2 bg-neutral-100 px-3.75 py-3.25 shadow-sm transition-[translate] duration-150 hover:-translate-y-0.5",
        selected ? "border-accent-2-600" : "border-transparent",
      )}
    >
      <div className="flex items-center gap-2.75">
        <Avatar user={member.user} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5">
            <button
              type="button"
              aria-pressed={selected}
              aria-label={`${member.user.displayName}の担当分で絞り込む`}
              onClick={onSelect}
              className="text-left text-base font-bold after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
            >
              {member.user.displayName}
            </button>
            {member.bike && (
              <span className="text-xs text-neutral-600">{member.bike}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-neutral-700">
            {confirmedCount === 0 && askingCount === 0
              ? "まだ何も運ばない"
              : `引き受け ${confirmedCount}件`}
          </p>
        </div>
        {askingCount > 0 && <Badge>確認中 {askingCount}</Badge>}
      </div>

      <div className="mt-2.5 flex">
        {member.isSelf ? (
          <GearMemoDialog
            eventId={eventId}
            title={member.bike ? `${member.user.displayName}・${member.bike}` : member.user.displayName}
            memo={member.gearMemo}
          >
            {/* relative z-10: 名前のボタンの ::after（カード全体）より上に置き、押したときに絞り込みではなくこちらが反応するようにする */}
            <button
              type="button"
              title="自分の積載装備メモを編集"
              className={cn(memoChipClass, "relative z-10 hover:border-solid hover:bg-surface")}
            >
              <Motorbike strokeWidth={2.75} className="size-3 shrink-0" />
              <span className="truncate">{memoLabel}</span>
            </button>
          </GearMemoDialog>
        ) : (
          <span className={memoChipClass}>
            <Motorbike strokeWidth={2.75} className="size-3 shrink-0" />
            <span className="truncate">{memoLabel}</span>
          </span>
        )}
      </div>
    </div>
  );
}

export { MemberCard };
