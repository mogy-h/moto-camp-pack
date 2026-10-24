# 実装進捗

状態: `[ ]` 未着手 / `[~]` 実装中 / `[x]` 完了
作業後は状態を更新し、必要なら行末に `— YYYY-MM-DD メモ` を追記する。
各項目末尾の `(#N)` は GitHub Issue の番号。PR をマージして Issue を閉じたら、同じ PR で該当行を `[x]` にする。
実装は本人が行う。Claude はメンターとして更新内容を提案し、本人の了承を得て書き込む（完了メモは PR 本文の案と一緒に書き込み、本人が差分で確認する）。

## 優先順位（2026-10-17 決定）

11月初旬（スクールの課題の期限）までに、中心の流れ（ログイン → イベント作成 → 招待 → 共同装備を早い者勝ちで分担 → 貸し借りを募集して引き受ける）が通しで動く状態を MVP とする。GitHub の Milestone「MVP」にも登録している。

- **MVP（この順に作る）**: #3 → #5 → #6 → #7 → #10 → #11 → #12 → #13 → #18 → #15（宛先なしの募集と「自分が貸す」だけ）→ #24
- **余裕があれば（上から順に）**: #17 通知の表示 → #20 退出・削除 → #19 イベント設定 → #14・#16 宛先を指定した貸し借り → #25 本番環境の分離とデモアカウント → #23 空状態・ローディング・エラー → #9 プロフィール
- **今回は作らない**: #8 パスワードリセット、#21 ゲスト参加、#22 ゲスト→アカウントの引き継ぎ
- 判断メモ
  - 通知レコードの作成（`notify.ts`）は MVP の Action に含め、表示（#17）だけ後回しにする。後から表示を足すときに Action を直さずに済む
  - #4（README の骨組み）は #24 にまとめた
  - イベントの既定の状態を `DRAFT` から `PUBLISHED` に変える（#10 でスキーマと screens.md に反映）。下書きのままだと招待リンクから参加できず、初めてのオーナーが戸惑うため。招待リンクを送るタイミングはオーナーが決められるので、下書きで参加を止める必要は薄い

## 0. セットアップ

- [x] create-next-app（TypeScript, App Router, `src/`, Tailwind v4, ESLint）— 2026-10-04 Next.js 16.3 / React 19.2。`src/` へ移動し `@/*` を `./src/*` に変更
- [x] Prisma 7 導入（`prisma7.config.ts`・`@prisma/adapter-pg`・生成先 `src/generated/prisma` を .gitignore）、`.env.local`（DATABASE_URL / DIRECT_URL）(#1) — 2026-10-12 設定ファイルは prisma init が付けた名前 `prisma7.config.ts` のまま。DIRECT_URL は Session pooler（Direct connection は IPv6 のみで WSL から届かないため）
- [x] `docs/schema.md` の内容で `prisma/schema.prisma` を作成 (#1) — 2026-10-12
- [x] 初回マイグレーション（Supabase）(#1) — 2026-10-12 Prisma 7.10 の `migrate dev` は Client を生成しないため、`prisma generate` を別に実行する
- [x] CHECK 制約のマイグレーション（`--create-only` で手書き。`docs/schema.md`「CHECK 制約」）(#1) — 2026-10-12 3パターンの INSERT で、両方向の制約と外部キーより先に判定されることを確認
- [x] Supabase の Data API を無効化し、`curl .../rest/v1/users` で弾かれることを確認 (#1) — 2026-10-12 無効化の前は公開キーで users が読めた（HTTP 200）→ 無効化の後は HTTP 503
- [x] ER 図（prisma-markdown で `docs/ERD.md` を自動生成）(#28) — 2026-10-14 スキーマを理解し、シードの準備にするため #24 から前倒し。手書きにしなかったのは、`prisma generate` のたびに更新されてスキーマとずれないため。列の説明は `///` で schema.prisma に移した。ERD.md に実在しない `_EventMemberToInvite` が出る（prisma-markdown v4.0.0 の誤判定。schema.md に注記）→ #24 で README から図を見せる前に再検討
- [x] シード（`docs/design` のサンプルデータ: 3名・富士山麓イベント など）(#2) — 2026-10-14 tsx で実行（prisma7.config.ts の migrations.seed）。lib/prisma.ts は server-only のため、seed.ts で DIRECT_URL の Client を作る。日付は日本時間の今日 + 10日（終了済みに見えないように）。デザインとスキーマの食い違い3点はスキーマに合わせた（seed.ts 冒頭のコメント）
- [x] Vercel へのデプロイ（GitHub 連携・環境変数・ビルド時の `prisma generate`・シードのデータで DB 接続を確認）(#29) — 2026-10-14 メンターの助言で #7 の前に実施。認証は Cookie・proxy・環境変数に頼る部分が多く、Supabase Auth のリダイレクト先に本番 URL が必要なため。2026-10-16 本番と開発で Supabase を分ける案は、無料枠（2プロジェクト）が別講座のプロジェクトで埋まっているため見送り。当面は本番・プレビューとも開発用 Supabase につなぎ、分離は #25。2026-10-16 完了。next build は tsconfig の対象を全て型チェックするので、Prisma を使うページがなくても生成済みの Client が必要（postinstall で prisma generate）。仮ページは connection() で動的レンダリングにした（付けないとビルド時に静的生成され、実行時の DB 接続を確認できない）
- [x] デザイントークンを `src/app/globals.css` へ移植、Tailwind `@theme` 連携 (#3) — 2026-10-17 トークンは `@theme static` に直接置いた（Tailwind の名前空間と同じ名前なので、`:root` から `var()` で参照すると循環するため。static で未使用の変数も出力する）。`--spacing: 4.4px` で Organic の `--space-n` と Tailwind の `p-n` を一致させた
- [x] shadcn/ui 導入（`init`。shadcn の CSS 変数 `--background` / `--primary` / `--radius` などを Organic のトークンに対応付け）(#3) — 2026-10-17 shadcn 4.21.4、Radix + Maia スタイル。shadcn の accent（ホバー背景）は Organic の accent（オレンジ）と名前がぶつかるので対応付けず、部品の `bg-accent` は #6 で置き換える。destructive は Organic に赤がないため accent-700 で代用（#6 で見直す）。ダークモードは使わない（`dark:` は `.dark` の下でだけ効く）
- [x] フォント（Caprasimo / Figtree / Zen Maru Gothic）、lucide-react (#3) — 2026-10-17 デザインに合わせ、見出しは Zen Maru Gothic、Caprasimo はロゴだけ（`font-display`）。Zen Maru Gothic は日本語のサブセットを preload できないので `preload: false`。init が入れた Hugeicons は lucide に替えた

## 1. 認証・セッション

- [x] Supabase Auth（メール + パスワード）: 登録・ログイン・ログアウト (#7) — 2026-10-22 登録時のメール確認は使わない（確認リンクの受け口が要らない。内蔵のメール送信には送信数の上限がある。#8 を作らないので、メールアドレスはログインの ID にしか使わない）。登録・ログイン・ログアウトは Server Action（`src/actions/auth.ts`）。Supabase のエラーは code で見分けて AppError にする（ログインの失敗では、メールとパスワードのどちらが違うかを言わない）。Supabase 側でもパスワードの最小文字数を 8 にした（公開キーで Auth の API を直接呼べるため）。キーは新しい形式の Publishable key。シードの3人を Admin API で Auth のアカウントと紐付けた（Secret key はシードだけが使い、Vercel には入れない）
- [ ] パスワードリセット (#8)
- [x] 登録時に `User` 作成（`authUid` 紐付け）(#7) — 2026-10-22 Auth と DB は1つのトランザクションにできないので、表示名を `user_metadata` にも入れ、`getCurrentUser` が `upsert` で作り直す（Prisma Studio で行を消して確認）。`auth.users` のトリガーは使わない（`auth` スキーマは Prisma の管理外）。schema.md への記録は次のブランチで行う
- [ ] ゲストクレームトークン（生成・ハッシュ保存・Cookie）(#21)
- [x] `getCurrentUser()`（Auth / ゲスト Cookie 両対応）(#7, #21) — 2026-10-22 Supabase Auth の分だけ（ゲスト Cookie は #21 で足す）。`cache()` で1回の表示につき1回だけ問い合わせる。`getClaims` のエラーは記録して `null`、Prisma のエラーは投げる（catch して `null` にすると、DB の障害がログアウトに見えるため）
- [ ] `requireMember(eventId)`（`leftAt: null` 判定）(#11)
- [x] 未ログイン時のリダイレクト（`src/proxy.ts`。Next.js 16 で middleware から改名）(#7) — 2026-10-22 proxy はセッションの更新と、未ログイン → `/login`・ログイン済みで `/login` → `/` のリダイレクトだけ。認証の確認はサーバー側で行う（Next.js のドキュメントにも、Server Action は proxy を通らないことがあるとある）。`/login`・`/signup`・`/terms`・`/j/...` は公開。ログイン後に元のページへ戻す仕組み（`?next=`）は、#18 で URL の検証も含めて作る

## 2. 共通ロジック（`lib/`）

- [x] `derive/`: eventPhase（下書き・準備中・完了。「今日」は引数で受け取る）(#5) — 2026-10-18 ほかの導出関数は、使う画面の Issue で作る方針に変更（土台だけ先に作ると使い道が見えにくいため）。判定は 完了 → 下書き → 準備中 の順（下書きのまま帰着日を過ぎたら完了。screens.md に追記）。帰着日の当日・翌日の境目をテストで確認
- [x] `derive/`: initials / avatarColor (#6) — 2026-10-20 色は userId から決める（並び順や表示名から決めると、画面や名前の変更で同じ人の色が変わるため）。文字コードの合計をパレットの数（5色）で割った余り。イニシャルは `Intl.Segmenter` で見た目の1文字ずつ数える（つなげた絵文字も途中で切れない）。avatarColor のテストは具体的な色ではなく性質（同じ結果・必ずパレットのどれか・全色が使われる）を確かめる
- [~] `derive/`: progress (#10)
- [ ] `derive/`: itemStatus / effectiveGearMemo (#11)
- [x] Vitest の導入（純関数のテスト）(#5) — 2026-10-18 Vitest 4.1。純関数だけをテストするので jsdom・Testing Library は入れていない。`@/` は `resolve.tsconfigPaths` で解決（プラグイン不要）
- [x] 日付ヘルパ（日本時間の「今日」、`date` 列と日付文字列の変換）。サーバーのローカル時刻に頼らない (#5) — 2026-10-18 `src/lib/date.ts`。`Intl.DateTimeFormat` の `timeZone` で日本時間の日付を出す。`now` を引数にしてテストで時刻を固定し、UTC 15:00 の境目を確認
- [ ] `permissions.ts`: `assertCan(action, member, item?)` (#12)
- [ ] `notify.ts`: 宛先解決（actor 以外の参加者など）と一括作成 (#12)
- [ ] 通知文面の生成（type + payload → タイトル・本文）(#17)
- [x] Server Action の戻り値型・エラー型（`AlreadyTakenError` など）(#5) — 2026-10-18 `toFailure` は AppError と zod のエラーだけメッセージを返し、想定外のエラーは中身を見せない。戻り値の形はルール 8 のまま（エラーの種類のコードは足さない。失敗時は毎回トースト + `router.refresh()` で足りる）
- [x] 入力制約の定数と zod スキーマ（`docs/screens.md`「入力項目の制約」。上限は DB の `varchar(n)` と一致させる）(#5) — 2026-10-18 文字数は `Array.from` で数える（zod の `.max()` は絵文字を2文字と数えるため）。`LIMITS` と schema.prisma の `varchar(n)` の一致をテストで確認。パスワードは前後の空白を除かない。`createEventSchema` は「今日」を引数で受け取る

## 3. 共通UI（`components/ui/`）

UI の土台は shadcn/ui。採用理由: モーダルやメニューのアクセシビリティ対応（フォーカス管理・キーボード操作・読み上げ）は実績のある実装に任せ、その分の時間を早い者勝ち・権限チェックなどの中心ロジックに使うため。

**shadcn/ui から追加し、Organic に合わせて調整する**（初期の見た目のまま使わない）
- [x] Button（primary / secondary / ghost / icon。`rounded-full`）(#6) — 2026-10-20 バリアントの名前は Organic に合わせた（shadcn の secondary はグレーで塗るボタンで、Organic の secondary（枠線だけ）と意味が違うため）。色は画面のデザイン（ダッシュボード）の値。フォーカスは shadcn の ring を外し、globals.css の outline に任せる。デザインの HTML からの転記は Claude が担当
- [x] Badge（デザインの Tag）(#6) — 2026-10-20 色ごとのバリアント（neutral / accent / accent-2 / warn）にし、どの状態にどの色を使うかは使う側で決める。Organic にない注意の色（warn）と 11px の文字（text-2xs）を globals.css に足した
- [x] Card (#6) — 2026-10-20
- [x] Dialog（モーダル）(#6) — 2026-10-20 Esc で閉じ、開いている間はフォーカスが中に留まることを確認。スマホでも収まるよう高さは画面の 88% まで
- [x] Input / Textarea / Label / Checkbox (#6) — 2026-10-20 入力欄の角は画面のデザインに合わせて `--radius-md`（CLAUDE.md の「入力は rounded-full」を修正）。Checkbox の初期の見た目は「積み込み済み」の丸いチェックにした（2026-10-21 訂正: 新規登録の規約同意は角の丸い四角なので、使う側で className を付けて変えている）
- [x] Radio Group（S・M・L のセグメント）(#6) — 2026-10-18 Toggle Group から変更。RadioGroup はフォームの中で隠れた input を出力するので、Server Action に FormData のまま値が届く（ToggleGroup は button の集まりで、state と hidden input を自分で書く必要がある）。デザインの HTML も radio。2026-10-20 項目そのものを丸いボタンにし、選ばれた項目を塗る
- [~] Tabs (#10)
- [ ] Popover（通知ポップオーバー）(#17)
- [~] Dropdown Menu（アカウントメニュー）(#10)
- [x] Sonner（トースト）(#6) — 2026-10-20 ダークモードを使わないので next-themes を外した。デザインにトーストがないため、色は Organic のトークンから選んだ。表示先は layout.tsx に1つ置く
- [ ] Sheet（スマホの操作シート。必要になったら）(#12)

**自作する（アプリ固有）**
- [x] Avatar / AvatarStack（色・イニシャルは `lib/derive/` から）(#6) — 2026-10-20 受け取るのは `{ id, displayName }` だけ（Prisma の型に縛られないため）。読み上げはイニシャルではなく表示名。5人目以降は「+2」のようにまとめる（デザインに描かれていないため決めた）。担当者がいないときの丸は #13 で作る
- [~] Header（戻る・ベル・アカウントメニュー）(#10)
- [ ] GearMemoInput（テキスト + プリセットタグ）(#9)

## 4. Server Actions（`actions/`）

各 Action: 所属判定 → 権限 → zod → トランザクション（更新 + 通知）→ revalidatePath

**events**
- [~] createEvent（作成者を OWNER で参加、`PUBLISHED` で作成）(#10)
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
- [ ] requestRental（宛先なし → open (#15)。宛先あり → asking + ASK は #16）
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

- [x] `/login`, `/signup` (#7) — 2026-10-22 タブは2つの URL へのリンク。フォームは `useActionState`。表示名・メールアドレス・規約の同意は state で持つ（React 19 は送信後にフォームを空に戻すため）。`noValidate` で、検証のメッセージを zod の日本語にそろえる。`/terms`（利用規約とプライバシーポリシー）を追加。招待リンクの導線は #18 で決める（screens.md 要確認 5）。見た目は Claude、Action とつなぐ部分は本人
- [ ] `/profile` (#9)
- [~] `/`（ダッシュボード）(#10)
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
- [ ] README.md の仕上げ（概要・スクショ・デモ URL・技術スタックと選定理由・設計で工夫した点・ER 図・ローカル起動手順・開発の進め方・AI の使い方）(#24)
- [ ] 本番環境の分離とデモアカウント (#25)
  - [ ] 本番用 Supabase プロジェクト（無料枠が空いてから）: Data API の無効化・migrate deploy・Auth 設定、Vercel の Production の接続先を切り替え
  - [ ] デモ用のデータをシードに追加し、本番に投入
  - [ ] デモアカウント（オーナーのイベントと、メンバーとして参加するイベントの両方を持たせる）
  - [ ] ログイン画面に「デモアカウントで試す」導線（本番のみ）
  - [ ] デモアカウントの保護（パスワード変更・アカウント削除を無効化）
  - [ ] デモデータの定期リセット（初期データに戻す）
