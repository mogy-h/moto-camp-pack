import { TriangleAlert } from "lucide-react";

type AttentionAlertProps = {
  openCount: number;
  unassignedCount: number;
  askingCount: number;
};

// 調整が必要なアイテムの件数をまとめて知らせる。どれも 0 件なら何も出さない（デザインの alertParts）
function AttentionAlert({ openCount, unassignedCount, askingCount }: AttentionAlertProps) {
  const parts: string[] = [];
  if (openCount > 0) parts.push(`貸せる人がいないリクエスト ${openCount}件`);
  if (unassignedCount > 0) parts.push(`運搬担当が未割り当ての共同装備 ${unassignedCount}件`);
  if (askingCount > 0) parts.push(`本人の引き受け待ち ${askingCount}件`);

  if (parts.length === 0) return null;

  return (
    <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-warn-500 bg-warn-500/16 px-3.75 py-3 text-warn-800">
      <TriangleAlert strokeWidth={2.75} className="mt-px size-4.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-sm font-bold">調整が必要な項目があります</p>
        <p className="text-xs leading-relaxed">{parts.join(" / ")}</p>
      </div>
    </div>
  );
}

export { AttentionAlert };
