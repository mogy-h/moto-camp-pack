// 入力項目の文字数の上限（docs/screens.md「入力項目の制約」）。
// DB に保存する項目は prisma/schema.prisma の @db.VarChar(n) と同じ値にする（limits.test.ts で確認している）
export const LIMITS = {
  displayName: 20, // users.display_name
  bike: 30, // users.bike
  gearMemo: 100, // users.gear_memo / event_members.gear_memo
  eventTitle: 50, // events.title
  eventPlace: 50, // events.place
  gearName: 30, // items.name / lendable_gears.name

  // DB に列がないもの
  email: 254, // 保存先は Supabase Auth
  passwordMin: 8,
  passwordMax: 72, // Supabase Auth の上限
  searchKeyword: 50, // DB に保存しない
} as const;
