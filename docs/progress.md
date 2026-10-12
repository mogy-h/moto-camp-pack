# 実装進捗

状態: `[ ]` 未着手 / `[~]` 実装中 / `[x]` 完了
作業後は状態を更新し、必要なら行末に `— YYYY-MM-DD メモ` を追記する。
各項目末尾の `(#N)` は GitHub Issue の番号。PR をマージして Issue を閉じたら、同じ PR で該当行を `[x]` にする。
実装は本人が行う。Claude はメンターとして更新内容を提案し、本人の了承を得て書き込む。

## 0. セットアップ

- [x] create-next-app（TypeScript, App Router, `src/`, Tailwind v4, ESLint）— 2026-10-04 Next.js 16.3 / React 19.2。`src/` へ移動し `@/*` を `./src/*` に変更
- [x] Prisma 7 導入（`prisma7.config.ts`・`@prisma/adapter-pg`・生成先 `src/generated/prisma` を .gitignore）、`.env.local`（DATABASE_URL / DIRECT_URL）(#1) — 2026-10-12 設定ファイルは prisma init が付けた名前 `prisma7.config.ts` のまま。DIRECT_URL は Session pooler（Direct connection は IPv6 のみで WSL から届かないため）
- [x] `docs/schema.md` の内容で `prisma/schema.prisma` を作成 (#1) — 2026-10-12
- [x] 初回マイグレーション（Supabase）(#1) — 2026-10-12 Prisma 7.10 の `migrate dev` は Client を生成しないため、`prisma generate` を別に実行する
- [x] CHECK 制約のマイグレーション（`--create-only` で手書き。`docs/schema.md`「CHECK 制約」）(#1) — 2026-10-12 3パターンの INSERT で、両方向の制約と外部キーより先に判定されることを確認
- [x] Supabase の Data API を無効化し、`curl .../rest/v1/users` で弾かれることを確認 (#1) — 2026-10-12 無効化の前は公開キーで users が読めた（HTTP 200）→ 無効化の後は HTTP 503
- [ ] シード（`docs/design` のサンプルデータ: 3名・富士山麓イベント など）(#2)
- [ ] デザイントークンを `src/app/globals.css` へ移植、Tailwind `@theme` 連携 (#3)
- [ ] shadcn/ui 導入（`init`。shadcn の CSS 変数 `--background` / `--primary` / `--radius` などを Organic のトークンに対応付け）(#3)
- [ ] フォント（Caprasimo / Figtree / Zen Maru Gothic）、lucide-react (#3)
- [ ] README の骨組み（概要・技術スタック・開発中である旨）。機能ができるごとに更新 (#4)

## 1. 認証・セッション

- [ ] Supabase Auth（メール + パスワード）: 登録・ログイン・ログアウト・パスワードリセット (#7, #8)
- [ ] 登録時に `User` 作成（`authUid` 紐付け）(#7)
- [ ] ゲストクレームトークン（生成・ハッシュ保存・Cookie）(#21)
- [ ] `getCurrentUser()`（Auth / ゲスト Cookie 両対応）(#7, #21)
- [ ] `requireMember(eventId)`（`leftAt: null` 判定）(#11)
- [ ] 未ログイン時のリダイレクト（`src/proxy.ts`。Next.js 16 で middleware から改名）(#7)

## 2. 共通ロジック（`lib/`）

- [ ] `derive/`: itemStatus / effectiveGearMemo / avatarColor / initials / progress / eventPhase（下書き・準備中・完了。「今日」は引数で受け取る）(#5)
- [ ] 日付ヘルパ（日本時間の「今日」、`date` 列と日付文字列の変換）。サーバーのローカル時刻に頼らない (#5)
- [ ] `permissions.ts`: `assertCan(action, member, item?)` (#12)
- [ ] `notify.ts`: 宛先解決（actor 以外の参加者など）と一括作成 (#12)
- [ ] 通知文面の生成（type + payload → タイトル・本文）(#17)
- [ ] Server Action の戻り値型・エラー型（`AlreadyTakenError` など）(#5)
- [ ] 入力制約の定数と zod スキーマ（`docs/screens.md`「入力項目の制約」。上限は DB の `varchar(n)` と一致させる）(#5)

## 3. 共通UI（`components/ui/`）

UI の土台は shadcn/ui。採用理由: モーダルやメニューのアクセシビリティ対応（フォーカス管理・キーボード操作・読み上げ）は実績のある実装に任せ、その分の時間を早い者勝ち・権限チェックなどの中心ロジックに使うため。

**shadcn/ui から追加し、Organic に合わせて調整する**（初期の見た目のまま使わない）
- [ ] Button（primary / secondary / ghost / icon。`rounded-full`）(#6)
- [ ] Badge（デザインの Tag）(#6)
- [ ] Card (#6)
- [ ] Dialog（モーダル）(#6)
- [ ] Input / Textarea / Label / Checkbox (#6)
- [ ] Toggle Group（S・M・L のセグメント）(#6)
- [ ] Tabs (#10)
- [ ] Popover（通知ポップオーバー）(#17)
- [ ] Dropdown Menu（アカウントメニュー）(#10)
- [ ] Sonner（トースト）(#6)
- [ ] Sheet（スマホの操作シート。必要になったら）(#12)

**自作する（アプリ固有）**
- [ ] Avatar / AvatarStack（色・イニシャルは `lib/derive/` から）(#6)
- [ ] Header（戻る・ベル・アカウントメニュー）(#10)
- [ ] GearMemoInput（テキスト + プリセットタグ）(#9)

## 4. Server Actions（`actions/`）

各 Action: 所属判定 → 権限 → zod → トランザクション（更新 + 通知）→ revalidatePath

**events**
- [ ] createEvent（作成者を OWNER で参加）(#10)
- [ ] updateEvent（日程・場所変更で SCHEDULE_CHANGED）— OWNER (#19)
- [ ] publishEvent — OWNER (#19)

**members / invites**
- [ ] createInvite / revokeInvite — OWNER (#18)
- [ ] joinWithAccount（upsert、MEMBER_JOINED）(#18)
- [ ] joinAsGuest（User + EventMember + Cookie、MEMBER_JOINED）(#21)
- [ ] leaveEvent / removeMember（離脱処理一式を1トランザクション、WITHDRAWN / REQUEST_CANCELLED）(#20)
- [ ] claimGuest（新規: authUid 紐付け / 既存: 付け替え or 統合。schema.md 参照）(#22)
- [ ] updateEventGearMemo（本人）(#11)

**items（共同装備）**
- [ ] addSharedItem（SHARED_ADDED）(#12)
- [ ] carrySharedItem（早い者勝ち）(#13)
- [ ] withdrawCarrier（共通: 担当クリア + WITHDRAWN）(#13)
- [ ] togglePacked（担当本人）(#13)
- [ ] updateItem / deleteItem (#12)

**items（貸し借り）**
- [ ] requestRental（宛先あり → asking + ASK / 宛先なし → open）(#15)
- [ ] offerRental（open に「自分が貸す」、早い者勝ち、ACCEPTED）(#15)
- [ ] acceptAsk（ACCEPTED、ASK を resolved）(#16)
- [ ] declineAsk（open に戻す、DECLINED、ASK を resolved）(#16)
- [ ] cancelRental（削除 + REQUEST_CANCELLED）(#15)

**lendables**
- [ ] addLendableGear / deleteLendableGear (#14)

**notifications**
- [ ] markRead / markAllRead（全体・イベント単位）(#17)

**profile**
- [ ] updateProfile（表示名・車種・既定メモ）(#9)

## 5. 画面

- [ ] `/login`, `/signup` (#7)
- [ ] `/profile` (#9)
- [ ] `/`（ダッシュボード）(#10)
- [ ] `/j/[token]`（招待・参加、5状態）(#18, #21)
- [ ] `/events/[eventId]`（イベント詳細）
  - [ ] ヘッダー・メンバーカード・絞り込み (#11)
  - [ ] 貸し借りセクション (#14, #15, #16)
  - [ ] 共同装備セクション (#12, #13)
  - [ ] 追加・編集・操作シートのモーダル (#12)
  - [ ] 通知ポップオーバー・招待モーダル (#17, #18)
  - [ ] イベント設定モーダル（オーナー: 基本情報・メンバー・招待リンク / メンバー: 退出）(#19, #20)
  - [ ] タブ復帰時の `router.refresh()` (#11)
- [ ] `/notifications` (#17)
- [ ] `/claim` (#22)

## 6. 仕上げ

- [ ] 空状態・ローディング・エラー表示 (#23)
- [ ] `docs/screens.md`「要確認」の解消
- [ ] ER 図（Mermaid。`docs/schema.md` と README に掲載）(#24)
- [ ] README.md の仕上げ（概要・スクショ・デモ URL・技術スタックと選定理由・設計で工夫した点・ER 図・ローカル起動手順・開発の進め方・AI の使い方）(#24)
- [ ] デモ環境の構築 (#25)
  - [ ] デモ用 Supabase プロジェクト（開発用と分ける）+ Vercel デプロイ
  - [ ] デモデータの投入（シードをデモ環境にも流せるようにする）
  - [ ] デモアカウント（オーナーのイベントと、メンバーとして参加するイベントの両方を持たせる）
  - [ ] ログイン画面に「デモアカウントで試す」導線（デモ環境のみ）
  - [ ] デモアカウントの保護（パスワード変更・アカウント削除を無効化）
  - [ ] デモデータの定期リセット（初期データに戻す）
