import { CornerUpLeft, Motorbike } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  ItemName,
  SizeChip,
  StatusBadge,
  rowBorder,
} from "@/components/events/item-parts";
import { cn } from "@/lib/utils";
import type { BoardItem, BoardMember } from "@/components/events/types";

type RentalRowProps = {
  item: BoardItem;
  requester: BoardMember | undefined; // 借りたい人
  carrier: BoardMember | undefined; // 貸す人（運ぶのもこの人）
};

// 貸し借り（RENTAL）の1行。#11 は表示だけで、「自分が貸す」「引き受ける」などのボタンは #13・#15 で足す
function RentalRow({ item, requester, carrier }: RentalRowProps) {
  const packed = item.packedAt !== null;
  const confirmed = item.status === "confirmed";

  return (
    <li
      className={cn(
        "flex flex-col gap-1.5 rounded-md border-2 bg-neutral-100 px-3.25 py-3 shadow-sm",
        rowBorder(item.status),
        packed && "opacity-75",
      )}
    >
      <div className="flex items-start gap-2">
        <ItemName name={item.name} packed={packed} />
        <StatusBadge status={item.status} />
      </div>
      <div className="flex">
        <SizeChip size={item.size} />
      </div>

      {requester && (
        <div className="flex">
          <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-neutral-200 pr-2.75 pl-0.75 text-xs whitespace-nowrap text-neutral-800">
            <Avatar user={requester.user} size="sm" />
            <CornerUpLeft strokeWidth={2.75} className="size-3 shrink-0" />
            借りたい
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {carrier ? (
          <span
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full pr-2.75 pl-0.75 text-xs font-semibold whitespace-nowrap",
              confirmed
                ? "bg-accent-2-200 text-accent-2-800"
                : "bg-neutral-200 text-neutral-800",
            )}
          >
            <Avatar user={carrier.user} size="sm" />
            <Motorbike strokeWidth={2.75} className="size-3 shrink-0" />
            {confirmed ? "貸す・運搬" : "確認中"}
          </span>
        ) : (
          <span className="inline-flex h-6.5 items-center rounded-full bg-warn-200 px-2.5 text-xs font-semibold text-warn-800">
            貸せる人を募集中
          </span>
        )}
      </div>
    </li>
  );
}

export { RentalRow };
