import { Check } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { DeleteItemDialog } from "@/components/events/delete-item-dialog";
import { ItemActionButton } from "@/components/events/item-action-button";
import {
  ItemName,
  SizeChip,
  StatusBadge,
  rowBorder,
} from "@/components/events/item-parts";
import {
  carrySharedItem,
  togglePacked,
  withdrawCarrier,
} from "@/actions/items";
import { cn } from "@/lib/utils";
import type { BoardItem, BoardMember } from "@/components/events/types";

// ボタンを隠すのは補助で、検証は Server Action の中で行う（実装ルール 1）
type SharedRowProps = {
  eventId: string;
  item: BoardItem;
  carrier: BoardMember | undefined; // 運ぶ人
  isCarrier: boolean; // 見ている本人が運搬担当か（積み込み済み・降りる）
  canDelete: boolean; // 登録者か（削除）
};

// 共同装備（SHARED）の1行
function SharedRow({
  eventId,
  item,
  carrier,
  isCarrier,
  canDelete,
}: SharedRowProps) {
  const packed = item.packedAt !== null;
  // 担当がまだいなければ、誰でも「自分が運ぶ」を押せる
  const canClaim = item.carrierId === null;

  let note = "運搬できる人を募集中 — 最初に押した人が担当";
  if (carrier) note = carrier.bike ? `運搬担当（${carrier.bike}）` : "運搬担当";

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-2.25 gap-y-1.75 rounded-md border-2 bg-neutral-100 px-3.25 py-3 shadow-sm",
        rowBorder(item.status),
        packed && "opacity-75",
      )}
    >
      {isCarrier && (
        // 押すたびに切り替わるボタンなので、状態は aria-pressed で伝え、名前は変えない
        <ItemActionButton
          action={togglePacked}
          eventId={eventId}
          itemId={item.id}
          variant="ghost"
          size="icon"
          aria-pressed={packed}
          aria-label={`${item.name}：積み込み済み`}
          title={packed ? "積み込み済みを取り消す" : "積み込み済みにする"}
          className="-ml-1.5 size-10 hover:bg-neutral-200"
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
      <div className="min-w-0 flex-[1_1_12.5rem]">
        <div className="flex flex-wrap items-center gap-2">
          <ItemName name={item.name} packed={packed} />
          <StatusBadge status={item.status} />
          <SizeChip size={item.size} />
        </div>
        <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
          {carrier && <Avatar user={carrier.user} size="sm" />}
          <span className="min-w-0 truncate text-xs text-neutral-700">
            {note}
          </span>
        </div>
      </div>
      {(canClaim || isCarrier || canDelete) && (
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {canClaim && (
            // 読み上げの名前には、見えている文字（自分が運ぶ）をそのまま含める
            <ItemActionButton
              action={carrySharedItem}
              eventId={eventId}
              itemId={item.id}
              size="sm"
              aria-label={`${item.name}を自分が運ぶ`}
              className="bg-accent-200 text-xs text-accent-800 shadow-none hover:bg-accent-300"
            >
              自分が運ぶ
            </ItemActionButton>
          )}
          {isCarrier && (
            <ItemActionButton
              action={withdrawCarrier}
              eventId={eventId}
              itemId={item.id}
              variant="secondary"
              size="sm"
              aria-label={`${item.name}の担当を降りる`}
              className="text-xs"
            >
              降りる
            </ItemActionButton>
          )}
          {canDelete && (
            <DeleteItemDialog
              eventId={eventId}
              itemId={item.id}
              itemName={item.name}
              carrierName={carrier?.user.displayName}
            />
          )}
        </div>
      )}
    </li>
  );
}

export { SharedRow };
