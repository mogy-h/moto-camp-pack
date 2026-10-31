export function effectiveGearMemo(
  member: { gearMemo: string | null },
  user: { gearMemo: string | null },
): string | null {
  return member.gearMemo ?? user.gearMemo;
}
