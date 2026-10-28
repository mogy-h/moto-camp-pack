import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/derive/itemStatus";
import type { BoardItem } from "@/components/events/types";

// 貸し借り・共同装備の行で共通に使う小さな部品

// 状態ごとのラベルと色（デザインの STATUS）。担当が決まっていないものは注意の色、確定は accent-2
const STATUS_BADGE = {
  open: { label: "未解決", variant: "warn", border: "border-warn-500" },
  unassigned: { label: "未割り当て", variant: "warn", border: "border-warn-500" },
  asking: { label: "引き受け確認中", variant: "neutral", border: "border-neutral-400" },
  confirmed: { label: "確定", variant: "accent-2", border: "border-accent-2-500" },
} as const;

// note を渡すと「未解決：貸せる人がいない」のような凡例になる
function StatusBadge({
  status,
  note,
  className,
}: {
  status: ItemStatus;
  note?: string;
  className?: string;
}) {
  const badge = STATUS_BADGE[status];
  return (
    <Badge variant={badge.variant} className={cn(badge.border, className)}>
      {badge.label}
      {note && `：${note}`}
    </Badge>
  );
}

const SIZE_LABEL = { S: "小物", M: "中くらい", L: "かさばる" } as const;

function SizeChip({ size }: { size: BoardItem["size"] }) {
  return (
    <span className="inline-flex h-5.5 shrink-0 items-center rounded-full bg-neutral-200 px-2.25 text-2xs text-neutral-800">
      {SIZE_LABEL[size]}
    </span>
  );
}

// 積み込み済みは取り消し線で表す。線は読み上げられないので、文字でも添える
function ItemName({ name, packed }: { name: string; packed: boolean }) {
  return (
    <span
      className={cn(
        "min-w-0 flex-auto text-sm leading-snug font-semibold text-pretty wrap-anywhere",
        packed ? "text-neutral-600 line-through" : "text-text",
      )}
    >
      {name}
      {packed && <span className="sr-only">（積み込み済み）</span>}
    </span>
  );
}

// 担当が決まっていない行（未解決・未割り当て）は、注意の色の点線で囲む
function rowBorder(status: ItemStatus) {
  return status === "open" || status === "unassigned"
    ? "border-dashed border-warn-500"
    : "border-transparent";
}

export { StatusBadge, SizeChip, ItemName, rowBorder };
