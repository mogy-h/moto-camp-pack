import { ForbiddenError } from "@/lib/errors";
import type { Role } from "@/generated/prisma/client";

// 権限の判定をここ1か所に集める（docs/schema.md「権限」・実装ルール 1）。
// DB を見ない関数なので、呼ぶ側が先に member と item を取っておく。許可されなければ ForbiddenError を投げる
type MemberForPermission = { id: string };
type ItemForPermission = {
  createdById: string;
  requesterId: string | null;
  carrierId: string | null;
};
type ItemAction =
  | "deleteItem"
  | "withdrawCarrier"
  | "togglePacked"
  | "cancelRental";

export function assertCan(
  action: ItemAction,
  member: MemberForPermission,
  item: ItemForPermission,
): void {
  switch (action) {
    case "deleteItem":
      // 登録者か借り手なら許可する（共同装備は requesterId が null なので、登録者だけになる）
      if (member.id === item.createdById || member.id === item.requesterId)
        return;
      throw new ForbiddenError();
    case "withdrawCarrier":
    case "togglePacked":
      // 担当本人だけ許可する
      if (member.id === item.carrierId) return;
      throw new ForbiddenError();
    case "cancelRental":
      // 借り手本人だけ許可する（共同装備は requesterId が null なので、誰も通らない）
      if (member.id === item.requesterId) return;
      throw new ForbiddenError();
  }
}

// イベントの管理（招待の発行など）はオーナーだけ（docs/schema.md「権限」）
export function assertOwner(member: { role: Role }): void {
  if (member.role === "OWNER") return;
  throw new ForbiddenError("オーナーだけが操作できます");
}
