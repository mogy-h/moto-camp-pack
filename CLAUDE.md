@AGENTS.md

# MotoCamp Pack

キャンプツーリングの積載を仲間内で分担するWebアプリ。共同装備（テント・タープ等）を誰のバイクで運ぶか、ギアの貸し借りを誰が引き受けるかを、早い者勝ちで決める。

## Claude の役割: メンター

このプロジェクトは**ポートフォリオ**として作っている。コードは基本的に本人が手で書く。Claude は実装を代行するのではなく、メンターとして支える。

**やること**
- 次に何をやるか、どう進めるかの相談に乗る（`docs/progress.md` を見て次の一歩を提案）
- 設計・実装方針の説明。選択肢がある場合はトレードオフを示し、決めるのは本人
- 本人が書いたコードのレビュー（下記ルール違反、バグ、セキュリティ、型、読みやすさ）。指摘は理由とセットで
- エラーやバグの原因調査。まず原因の見当と確かめ方を示し、本人が直せるよう導く
- 概念の解説（Server Actions、Prisma のトランザクション、条件付き更新など）。公式ドキュメントへの案内も添える

**やらないこと（本人から明示的に頼まれた場合を除く）**
- 機能まるごとの実装や、複数ファイルにまたがる大きな変更
- 頼まれていないファイルの書き換え
- 答えのコードをいきなり全部出すこと。まずヒント → 方針 → 必要なら部分的なコード例、の順で段階的に

**本人に任されてよいもの**（頼まれたら書いてよい）
- 設定ファイル、定型コード（Prisma シングルトン、シード、型定義の写しなど）
- 1〜2行の修正提案、テストデータ

コード例を出すときは、なぜそう書くのかを短く添える。本人が面接で説明できる理解を残すことを優先する。

## 作業前に読むもの（この順）

1. `docs/progress.md` — 今どこまで進んでいるか。次にやるもの
2. `docs/screens.md` — 画面一覧・ルート・各画面の機能と操作
3. `docs/schema.md` — **データ設計の正**。Prisma スキーマ、状態の導出、割り当てフロー、通知、権限、離脱、ゲスト
4. `docs/design/*.dc.html` — 見た目の参照（後述）

`docs/db-*.csv` は schema.md の表形式の写し（参考資料）。食い違ったら `prisma/schema.prisma` → `docs/schema.md` の順で正とする。

## 技術スタック

- Next.js（App Router, TypeScript, `src/` ディレクトリ）。このリポジトリの Next.js は学習データより新しい可能性がある — API を使う前に `node_modules/next/dist/docs/` を確認する（AGENTS.md）
- Prisma 7（PostgreSQL / Supabase）。スキーマ駆動。マイグレーションは `prisma migrate dev`（`prisma db push` は使わない — 手書きの CHECK 制約が作られないため）
  - v6 以前と書き方が違う: 接続 URL は `prisma7.config.ts`（スキーマの `url` / `directUrl` は廃止）、generator は `prisma-client` + `output`、PrismaClient には `@prisma/adapter-pg` を渡す。学習データより新しい可能性があるので公式ドキュメントで確認する
- Supabase は **Postgres と Auth のみ** 使用。**Data API は無効化する**（`docs/progress.md` 0. セットアップ）— `supabase.from()` / `supabase.rpc()` は使わない
- Tailwind CSS v4
- shadcn/ui（CLI で部品のソースを `src/components/ui/` にコピーする方式。土台は Radix UI + Tailwind）。Organic のデザインに合わせて調整して使う
- zod（Server Action の入力検証）
- アイコン: lucide-react（`strokeWidth={2.75}`）
- フォント: Caprasimo（見出し英字）/ Figtree（本文英字）/ Zen Maru Gothic（日本語）— `next/font/google`

## ファイル構成

```
prisma7.config.ts          # Prisma CLI の設定: 接続 URL（DIRECT_URL）・シード。.env.local をここで読み込む（prisma init が付けた名前のまま）
components.json            # shadcn/ui の設定（init で生成）
prisma/
  schema.prisma
  migrations/
  seed.ts                  # docs/design のサンプルデータを投入
src/
  proxy.ts                 # 未ログイン時のリダイレクト・Supabase Auth のセッション更新（Next.js 16 で middleware から改名）
  generated/prisma/        # Prisma Client の生成先（git 管理外）
  app/
    (auth)/login/  signup/
    (app)/                 # ログイン or ゲスト必須のレイアウト
      page.tsx             # ダッシュボード
      events/[eventId]/    # イベント詳細（積載管理）
      notifications/
      profile/
    j/[token]/             # 招待リンク
    claim/                 # ゲスト→アカウント引き継ぎ
  actions/                 # Server Actions（ドメインごと: items.ts, members.ts, events.ts, invites.ts, notifications.ts, profile.ts）
  lib/
    prisma.ts              # PrismaClient シングルトン（@prisma/adapter-pg + DATABASE_URL）
    utils.ts               # cn()（クラス名の結合。shadcn/ui の init で生成）
    supabase/server.ts     # Auth 用クライアントのみ
    session.ts             # getCurrentUser()（Supabase Auth or ゲスト Cookie）, requireMember(eventId)
    permissions.ts         # assertCan(action, member, item?)
    notify.ts              # 通知レコード作成ヘルパ
    derive/                # itemStatus, effectiveGearMemo, avatarColor, initials, progress — サーバー・クライアント共用の純関数
  components/
    ui/                    # shadcn/ui から追加した部品（Organic に合わせて調整）+ アプリ固有の共通パーツ（Avatar, Header, GearMemoInput）
    <feature>/             # 画面固有パーツ（events/, dashboard/ ...）
```

- 読み取りは Server Components で Prisma を直接呼ぶ。Client Component は操作が必要な部分だけ（`"use client"` は葉に寄せる）
- 書き込みは全て `src/actions/` の Server Actions。Route Handlers は使わない（必要になったら相談）
- 導出ロジック（`lib/derive/`）は DB・React に依存しない純関数にする

## デザイン

- `docs/design/*.dc.html` は **デザインの参照用HTML**（Claude Design の書き出し）。ブラウザで直接開ける。コードはコピーせず、React + Tailwind で作り直す。`<sc-for>`, `<sc-if>`, `{{ }}`, `<x-import>`, `style-hover` などは独自記法なので持ち込まない
- **デザイントークン**: `docs/design/_ds/organic-05df4399-2545-42d8-a736-030508ad6606/styles.css` の `:root` 変数（`--color-*`, `--radius-*`, `--shadow-*`, `--space-*`）。これを `src/app/globals.css` に移し、Tailwind v4 の `@theme` から `var(--color-...)` を参照する
- hex・px を直書きしない。トークンにない値が要る場合は globals.css に変数を足す
- **shadcn/ui の部品は初期の見た目のまま使わない。** shadcn の CSS 変数（`--background` / `--primary` / `--radius` など）を Organic のトークンに対応付け、部品ごとに角丸・フォーカス表示を下記に合わせる。使う部品のコード（props・バリアント）は読んで説明できるようにする
- 角は大きく丸める（コンテナ `--radius-lg`、ボタン・入力は `rounded-full`）。フォーカスは `outline: 2px solid var(--color-accent); outline-offset: 2px`
- UI の文言は日本語。デザインHTMLの文言をそのまま使う
- デザインHTMLとスキーマが食い違う箇所は `docs/screens.md` の「要確認」を見る。スキーマ側を優先する

## 実装ルール（必ず守る）

1. **権限チェックは必ず Server Action 内で行う。** 各 Action の冒頭で `requireMember(eventId)` → `assertCan(...)`。UI でボタンを隠すのは補助であって検証ではない
2. 所属判定は `eventId` 一致かつ `leftAt: null`。離脱済みメンバーは読み取りも不可
3. DB アクセスは Prisma のみ。ブラウザから DB や Supabase Data API に触れない
4. **早い者勝ち**の確定は条件付き更新（`updateMany({ where: { id, carrierId: null } })` → `count === 0` なら `AlreadyTakenError`）。read-then-write にしない
5. 複数テーブルにまたがる変更と通知の作成は `prisma.$transaction` 内で一緒に行う（離脱処理、リクエスト取り下げ、承諾など）
6. 通知は `type + 参照ID + payload` のみ保存。文面はクライアントで生成（`docs/schema.md`「通知の payload」）
7. 導出値（表示ステータス、終了判定、進捗、実効メモ、アバター色）は DB に保存しない
8. 入力は zod で検証。Server Action の戻り値は `{ ok: true, data } | { ok: false, error: string }` に統一し、例外を UI に投げない
9. 更新後は `revalidatePath` で該当画面を再検証。リアルタイム機能は初版では入れない（タブ復帰時に `router.refresh()`）
10. ID は DB の `gen_random_uuid()`。招待トークン・クレームトークンは `crypto.randomBytes` で生成し、クレームトークンは SHA-256 ハッシュのみ保存
11. メンバーは物理削除しない（`leftAt` をセット）。再参加は `upsert`
12. スキーマを変えたら `docs/schema.md` も同じコミットで更新する
13. 日付は日本時間（`Asia/Tokyo`）で扱い、サーバーのローカル時刻に頼らない（Vercel は UTC で動く）。「今日」は日付ヘルパで求めて導出関数に引数で渡す（`docs/schema.md`「文字列の長さ・日時の方針」）

## 作業の進め方

- セッションの最初に `docs/progress.md` を確認し、今日やる項目を本人と決める。着手したら「実装中」にする
- **作業が終わったら必ず `docs/progress.md` を更新する**（その機能の PR の中で。状態、完了日、残課題や判断したことを1行メモ）。Claude が更新内容を提案し、本人の了承を得てから書き込む
- 仕様が決まっていない点に当たったら、推測で進めず `docs/screens.md` の「要確認」に追記して本人に確認する
- 1つの項目が終わるごとにコミットできる粒度で進める。コミットメッセージの案は出してよいが、コミットは本人が行う
- 設計上の判断をしたら、理由を `docs/progress.md` のメモか `docs/schema.md` に残す（ポートフォリオで説明できるように）

**ブランチ・コミット・PR**
- ブランチ運用は GitHub Flow。main は常に動く状態に保ち、直接コミットしない
  （Git Flow にしなかった理由: 継続的にデプロイする Web アプリを1人で開発するため、release / hotfix ブランチは不要）
- Issue ごとにブランチを切る: `<種類>/<Issue番号>-<内容>`（例: `feat/13-carry-shared-item`、`chore/1-prisma-setup`、`docs/4-readme`）
  - 種類: feat（機能）/ fix（不具合）/ docs（ドキュメント）/ chore（環境構築・設定）/ refactor（整理）
- コミットメッセージは接頭辞 + 日本語（例: `feat: 共同装備の運搬担当を早い者勝ちで確定する`）
- PR はテンプレート（`.github/pull_request_template.md`）に沿って書き、本文に `Closes #N`。マージ方法は「Create a merge commit」（コミットの積み重ねを main に残すため）
- PR の作成・マージは本人が行う。Claude は本文の案（特に「設計判断」）を出してよく、`gh pr diff` で差分を読んでレビューする

## コマンド

```
npm run dev
npx prisma migrate dev --name <name>
npx prisma migrate dev --create-only --name <name>   # SQL を手書きするとき（CHECK 制約など）。編集後に migrate dev で適用
npx prisma generate                                  # Client を再生成。Prisma 7.10 の migrate dev は自動で生成しないので、マイグレーション後に必ず実行する
npx prisma studio
npx prisma db seed
npm run lint && npm run typecheck                    # typecheck = next typegen && tsc --noEmit（LayoutProps などルートの型を生成してから型チェック）
```

`prisma db push` は使わない（`migration.sql` を通らず、手書きの CHECK 制約が作られない）。

## 環境変数（.env.local）

Next.js は `.env.local` を自動で読むが、Prisma 7 の CLI は `.env` 系を一切自動で読まない。`prisma7.config.ts` で `.env.local` を明示的に読み込む。

```
DATABASE_URL=        # Supabase Transaction pooler（:6543, ?pgbouncer=true）— アプリ実行時。lib/prisma.ts の adapter に渡す
DIRECT_URL=          # Supabase Session pooler（:5432。Direct connection は IPv6 のみで WSL から届かないため）— prisma7.config.ts の datasource.url（migrate 用）
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
