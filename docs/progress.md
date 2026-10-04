# 実装進捗

状態: `[ ]` 未着手 / `[~]` 実装中 / `[x]` 完了
作業後は状態を更新し、必要なら行末に `— YYYY-MM-DD メモ` を追記する。
実装は本人が行う。Claude はメンターとして更新内容を提案し、本人の了承を得て書き込む。

## 0. セットアップ

- [ ] create-next-app（TypeScript, App Router, `src/`, Tailwind v4, ESLint）
- [ ] Prisma 導入、`.env.local`（DATABASE_URL / DIRECT_URL）
- [ ] `docs/schema.md` の内容で `prisma/schema.prisma` を作成
- [ ] 初回マイグレーション（Supabase）
- [ ] Supabase の Data API を無効化し、`curl .../rest/v1/User` で弾かれることを確認
- [ ] シード（`docs/design` のサンプルデータ: 3名・富士山麓イベント など）
- [ ] デザイントークンを `src/app/globals.css` へ移植、Tailwind `@theme` 連携
- [ ] フォント（Caprasimo / Figtree / Zen Maru Gothic）、lucide-react

## 1. 認証・セッション

- [ ] Supabase Auth（メール + パスワード）: 登録・ログイン・ログアウト・パスワードリセット
- [ ] 登録時に `User` 作成（`authUid` 紐付け）
- [ ] ゲストクレームトークン（生成・ハッシュ保存・Cookie）
- [ ] `getCurrentUser()`（Auth / ゲスト Cookie 両対応）
- [ ] `requireMember(eventId)`（`leftAt: null` 判定）
- [ ] 未ログイン時のリダイレクト（middleware）

## 2. 共通ロジック（`lib/`）

- [ ] `derive/`: itemStatus / effectiveGearMemo / avatarColor / initials / progress / eventPhase（下書き・準備中・完了）
- [ ] `permissions.ts`: `assertCan(action, member, item?)`
- [ ] `notify.ts`: 宛先解決（actor 以外の参加者など）と一括作成
- [ ] 通知文面の生成（type + payload → タイトル・本文）
- [ ] Server Action の戻り値型・エラー型（`AlreadyTakenError` など）

## 3. 共通UI（`components/ui/`）

- [ ] Button（primary / secondary / ghost / icon）
- [ ] Tag
- [ ] Card
- [ ] Dialog（モーダル）
- [ ] Field / Input / Textarea / Segmented（S・M・L）
- [ ] Avatar / AvatarStack
- [ ] Toast
- [ ] Header（戻る・ベル・アカウントメニュー）
- [ ] GearMemoInput（テキスト + プリセットタグ）

## 4. Server Actions（`actions/`）

各 Action: 所属判定 → 権限 → zod → トランザクション（更新 + 通知）→ revalidatePath

**events**
- [ ] createEvent（作成者を OWNER で参加）
- [ ] updateEvent（日程・場所変更で SCHEDULE_CHANGED）— OWNER
- [ ] publishEvent — OWNER

**members / invites**
- [ ] createInvite / revokeInvite — OWNER
- [ ] joinWithAccount（upsert、MEMBER_JOINED）
- [ ] joinAsGuest（User + EventMember + Cookie、MEMBER_JOINED）
- [ ] leaveEvent / removeMember（離脱処理一式を1トランザクション、WITHDRAWN / REQUEST_CANCELLED）
- [ ] claimGuest（新規: authUid 紐付け / 既存: 付け替え or 統合。schema.md 参照）
- [ ] updateEventGearMemo（本人）

**items（共同装備）**
- [ ] addSharedItem（SHARED_ADDED）
- [ ] carrySharedItem（早い者勝ち）
- [ ] withdrawCarrier（共通: 担当クリア + WITHDRAWN）
- [ ] togglePacked（担当本人）
- [ ] updateItem / deleteItem

**items（貸し借り）**
- [ ] requestRental（宛先あり → asking + ASK / 宛先なし → open）
- [ ] offerRental（open に「自分が貸す」、早い者勝ち、ACCEPTED）
- [ ] acceptAsk（ACCEPTED、ASK を resolved）
- [ ] declineAsk（open に戻す、DECLINED、ASK を resolved）
- [ ] cancelRental（削除 + REQUEST_CANCELLED）

**lendables**
- [ ] addLendableGear / deleteLendableGear

**notifications**
- [ ] markRead / markAllRead（全体・イベント単位）

**profile**
- [ ] updateProfile（表示名・車種・既定メモ）

## 5. 画面

- [ ] `/login`, `/signup`
- [ ] `/profile`
- [ ] `/`（ダッシュボード）
- [ ] `/j/[token]`（招待・参加、5状態）
- [ ] `/events/[eventId]`（イベント詳細）
  - [ ] ヘッダー・メンバーカード・絞り込み
  - [ ] 貸し借りセクション
  - [ ] 共同装備セクション
  - [ ] 追加・編集・操作シートのモーダル
  - [ ] 通知ポップオーバー・招待モーダル
  - [ ] イベント設定モーダル（オーナー: 基本情報・メンバー・招待リンク / メンバー: 退出）
  - [ ] タブ復帰時の `router.refresh()`
- [ ] `/notifications`
- [ ] `/claim`

## 6. 仕上げ

- [ ] 空状態・ローディング・エラー表示
- [ ] `docs/screens.md`「要確認」の解消
- [ ] Vercel デプロイ
