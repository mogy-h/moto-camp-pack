import { Avatar } from "@/components/ui/avatar";
import {
  ItemName,
  SizeChip,
  StatusBadge,
  rowBorder,
} from "@/components/events/item-parts";
import { cn } from "@/lib/utils";
import type { BoardItem, BoardMember } from "@/components/events/types";

type SharedRowProps = {
  item: BoardItem;
  carrier: BoardMember | undefined; // 運ぶ人
};

// 共同装備（SHARED）の1行。「自分が運ぶ」「降りる」などのボタンは #13 で足す
function SharedRow({ item, carrier }: SharedRowProps) {
  const packed = item.packedAt !== null;

  let note = "運搬できる人を募集中 — 最初に押した人が担当";
  if (carrier) note = carrier.bike ? `運搬担当（${carrier.bike}）` : "運搬担当";

  return (
    <li
      className={cn(
        "rounded-md border-2 bg-neutral-100 px-3.25 py-3 shadow-sm",
        rowBorder(item.status),
        packed && "opacity-75",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <ItemName name={item.name} packed={packed} />
        <StatusBadge status={item.status} />
        <SizeChip size={item.size} />
      </div>
      <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
        {carrier && <Avatar user={carrier.user} size="sm" />}
        <span className="min-w-0 truncate text-xs text-neutral-700">{note}</span>
      </div>
    </li>
  );
}

export { SharedRow };
