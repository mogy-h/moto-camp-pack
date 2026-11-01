import type { ItemStatus } from "@/lib/derive/itemStatus";

// イベント詳細の部品が受け取るデータの形。値はページ（page.tsx）で計算して渡す

// 参加中のメンバー1人分。id は EventMember の id（アイテムの carrierId・requesterId が指すもの）
type BoardMember = {
  id: string;
  user: { id: string; displayName: string };
  bike: string | null;
  // 実効メモ（イベント用のメモ ?? プロフィールのメモ）
  gearMemo: string | null;
  // 担当が確定したアイテムの数と、頼まれていて返事をしていないアイテムの数
  confirmedCount: number;
  askingCount: number;
  // 見ている本人のカードか
  isSelf: boolean;
};

type BoardItem = {
  id: string;
  kind: "SHARED" | "RENTAL";
  name: string;
  size: "S" | "M" | "L";
  createdById: string;
  requesterId: string | null;
  carrierId: string | null;
  packedAt: Date | null;
  status: ItemStatus;
};

export type { BoardMember, BoardItem };
