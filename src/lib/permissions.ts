import { ForbiddenError } from "@/lib/errors";

// 権限の判定をここ1か所に集める（docs/schema.md「権限」・実装ルール 1）。
// DB を見ない関数なので、呼ぶ側が先に member と item を取っておく。許可されなければ ForbiddenError を投げる
type MemberForPermission = { id: string };
type ItemForPermission = { createdById: string; requesterId: string | null };

type ItemAction = "deleteItem"; // #13 で「降りる」などを足す

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
  }
}
