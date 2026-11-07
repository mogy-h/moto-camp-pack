import { Check, CornerUpLeft, Motorbike } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { CancelRentalDialog } from "@/components/events/cancel-rental-dialog";
import { ItemActionButton } from "@/components/events/item-action-button";
import {
  ItemName,
  SizeChip,
  StatusBadge,
  rowBorder,
} from "@/components/events/item-parts";
import { offerRental, togglePacked, withdrawCarrier } from "@/actions/items";
import { cn } from "@/lib/utils";
import type { BoardItem, BoardMember } from "@/components/events/types";

// ボタンを隠すのは補助で、検証は Server Action の中で行う（実装ルール 1）
type RentalRowProps = {
  eventId: string;
  item: BoardItem;
  requester: BoardMember | undefined; // 借りたい人
  carrier: BoardMember | undefined; // 貸す人（運ぶのもこの人）
  canOffer: boolean; // 「自分が貸す」を出すか
  isCarrier: boolean; // 見ている本人が貸す人か（積み込み済み・降りる）
  canCancel: boolean; // 見ている本人が借り手か（取り下げ）
};

// 貸し借り（RENTAL）の1行
function RentalRow({
  eventId,
  item,
  requester,
  carrier,
  canOffer,
  isCarrier,
  canCancel,
}: RentalRowProps) {
  const packed = item.packedAt !== null;
  const confirmed = item.status === "confirmed";
  // 積み込み済み・降りるは、貸すことが決まってから出す（宛先付きの依頼に返事をする前の asking は #16）
  const isLender = isCarrier && confirmed;

  return (
    <li
      className={cn(
        "flex items-start gap-2.25 rounded-md border-2 bg-neutral-100 px-3.25 py-3 shadow-sm",
        rowBorder(item.status),
        packed && "opacity-75",
      )}
    >
      {isLender && (
        // 押すたびに切り替わるボタンなので、状態は aria-pressed で伝え、名前は変えない（SharedRow と同じ）
        // -my-3: 押せる範囲は広いまま、チェックの中心を1行目の名前にそろえる
        <ItemActionButton
          action={togglePacked}
          eventId={eventId}
          itemId={item.id}
          variant="ghost"
          size="icon"
          aria-pressed={packed}
          aria-label={`${item.name}：積み込み済み`}
          title={packed ? "積み込み済みを取り消す" : "積み込み済みにする"}
          className="-my-3 -ml-1.5 size-10 hover:bg-neutral-200"
        >
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-full border-2 text-accent-2-100",
              packed
                ? "border-accent-2-600 bg-accent-2-600"
                : "border-neutral-400",
            )}
          >
            <Check
              strokeWidth={2.75}
              className={cn("size-3.5", !packed && "opacity-0")}
            />
          </span>
        </ItemActionButton>
      )}

      <div className="flex min-w-0 flex-auto flex-col gap-1.5">
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

          {(canOffer || isLender) && (
            <div className="ml-auto flex items-center gap-1.5">
              {canOffer && (
                // 読み上げの名前には、見えている文字（自分が貸す）をそのまま含める
                <ItemActionButton
                  action={offerRental}
                  eventId={eventId}
                  itemId={item.id}
                  size="sm"
                  aria-label={`${item.name}を自分が貸す`}
                  className="bg-accent-2-600 text-xs text-accent-2-100 shadow-none hover:bg-accent-2-700"
                >
                  自分が貸す
                </ItemActionButton>
              )}
              {isLender && (
                <ItemActionButton
                  action={withdrawCarrier}
                  eventId={eventId}
                  itemId={item.id}
                  variant="secondary"
                  size="sm"
                  aria-label={`${item.name}の貸す担当を降りる`}
                  className="text-xs"
                >
                  降りる
                </ItemActionButton>
              )}
            </div>
          )}
        </div>
      </div>

      {canCancel && (
        // デザインの行の右上の操作ボタンの位置。-m で、押せる範囲を広げたまま行の余白に寄せる
        <div className="-mt-1.5 -mr-1.5 shrink-0">
          <CancelRentalDialog
            eventId={eventId}
            itemId={item.id}
            itemName={item.name}
            carrierName={carrier?.user.displayName}
          />
        </div>
      )}
    </li>
  );
}

export { RentalRow };
