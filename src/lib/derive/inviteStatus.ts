                        // 有効 | 無効 | 期限切れ
export type InviteStatus = "valid" | "revoked" | "expired";

// 招待リンクが使えるか。「今」は呼ぶ側から受け取る（テストで時刻を固定できるように）
export function inviteStatus(
  invite: { revokedAt: Date | null; expiresAt: Date | null },
  now: Date,
): InviteStatus {
  if (invite.revokedAt !== null) return "revoked";
  if (invite.expiresAt !== null && invite.expiresAt <= now) return "expired";
  return "valid";
}
