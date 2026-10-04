# MotoCamp Pack — 確定スキーマ

前提スタック: Next.js App Router / Prisma / Supabase / Tailwind

決定事項:
- 「貸せるギア」はイベント単位（ユーザー台帳は持たない）
- 積載装備メモはプロフィールに1本 + イベント単位で上書き可
- 通知は `type + 参照ID + payload` のみ保存、文面はクライアントで生成
- サイズ `S/M/L` は表示ラベルのみ（判定に使わない）
- 招待リンクからゲスト参加可・後からアカウント紐付け
- アイテムは1テーブル + `kind` 判別
- メンバーは `leftAt` による論理削除
- **運搬担当は早い者勝ち**。立候補した瞬間に確定し、重複（clash）は発生しない。担当者はいつでも降りられ、降りたら全員に通知
- 宛先を指定しない貸し借り募集を許す（追加モーダルでメンバー指定なしを選べる）
- 貸し借りリクエストの削除時は `REQUEST_CANCELLED` を通知
- **主キーは UUID**。DB側の `gen_random_uuid()` で生成し、Supabase `auth.users.id` と型を揃える

## テーブル

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // プール経由（6543, ?pgbouncer=true）— アプリ実行時
  directUrl = env("DIRECT_URL")     // 直接接続（5432）— prisma migrate 用
}

// アカウント（ゲストは authUid = null）
model User {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  authUid     String?  @unique @db.Uuid  // Supabase auth.users.id（uuid）。auth スキーマへのリレーションは張らない
  displayName String
  bike        String?
  gearMemo    String?                 // 既定の積載装備メモ
  claimTokenHash String? @unique      // ゲストのクレームトークンの SHA-256。紐付け後・失効時は null
  createdAt   DateTime @default(now())

  members        EventMember[]
  createdEvents  Event[]      @relation("EventCreatedBy")
}

model Event {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title       String
  place       String?
  startDate   DateTime
  endDate     DateTime?
  status      EventStatus @default(DRAFT)   // DRAFT | PUBLISHED
  createdById String @db.Uuid
  createdAt   DateTime    @default(now())

  createdBy     User           @relation("EventCreatedBy", fields: [createdById], references: [id])
  members       EventMember[]
  items         Item[]
  lendables     LendableGear[]
  invites       Invite[]
  notifications Notification[]
}
// 「終了」は endDate < now() からの導出。保存しない

model EventMember {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId    String @db.Uuid
  userId     String @db.Uuid
  role       Role     @default(MEMBER)  // OWNER | MEMBER
  isGuest    Boolean  @default(false)
  gearMemo   String?                    // イベント単位の上書き。null なら User.gearMemo
  joinedAt   DateTime @default(now())
  leftAt     DateTime?                  // 論理削除。null = 参加中
  invitedVia String? @db.Uuid           // 経由した招待リンク

  event      Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user       User    @relation(fields: [userId], references: [id])
  invite     Invite? @relation("InviteJoins", fields: [invitedVia], references: [id])

  // Item への3つの経路は名前で区別する
  requestedItems Item[] @relation("ItemRequester")
  carriedItems   Item[] @relation("ItemCarrier")
  createdItems   Item[] @relation("ItemCreatedBy")

  lendables      LendableGear[]
  createdInvites Invite[]       @relation("InviteCreatedBy")

  // Notification への2つの経路も同様
  receivedNotifications Notification[] @relation("NotifRecipient")
  actedNotifications    Notification[] @relation("NotifActor")

  @@unique([eventId, userId])
  @@index([eventId, leftAt])
}
// 参加中の判定は常に leftAt: null
// 実効メモ = member.gearMemo ?? user.gearMemo
// アバター色・イニシャルは userId / displayName から決定的に導出（保存しない）

model Item {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId      String @db.Uuid
  kind         ItemKind                   // SHARED | RENTAL
  name         String
  size         Size      @default(M)      // S | M | L
  requesterId  String? @db.Uuid           // RENTAL のみ（借り手）
  sourceGearId String? @db.Uuid           // 登録ギア宛のリクエストなら。null = 宛先なしの募集
  carrierId    String? @db.Uuid           // 運搬担当。null = 未割り当て
  acceptedAt   DateTime?                  // 担当確定時刻。宛先指定の依頼で未承諾なら null
  packedAt     DateTime?                  // 積み込み済み時刻
  createdById  String @db.Uuid
  createdAt    DateTime  @default(now())

  event      Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  requester  EventMember?  @relation("ItemRequester",  fields: [requesterId],  references: [id])
  carrier    EventMember?  @relation("ItemCarrier",    fields: [carrierId],    references: [id])
  createdBy  EventMember   @relation("ItemCreatedBy",  fields: [createdById],  references: [id])
  sourceGear LendableGear? @relation(fields: [sourceGearId], references: [id], onDelete: SetNull)

  notifications Notification[]

  @@index([eventId, kind])
}
// CHECK: kind = 'RENTAL' なら requesterId IS NOT NULL
// 早い者勝ちのため立候補テーブルは持たない。担当は carrierId の1列のみ

// イベント内で「貸せます」と登録されたギア
model LendableGear {
  id       String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId  String @db.Uuid
  memberId String @db.Uuid
  name     String
  size     Size   @default(M)

  event   Event       @relation(fields: [eventId],  references: [id], onDelete: Cascade)
  member  EventMember @relation(fields: [memberId], references: [id], onDelete: Cascade)
  request Item[]      // このギア宛の貸し借りリクエスト
}

model Notification {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId     String @db.Uuid
  recipientId String @db.Uuid             // 宛先メンバー
  type        NotifType
  actorId     String? @db.Uuid            // 操作した本人
  itemId      String? @db.Uuid            // REQUEST_CANCELLED では null（アイテムが消えるため）
  payload     Json?                       // 下記参照
  readAt      DateTime?
  resolvedAt  DateTime?                   // ASK への対応済み（承諾・辞退）
  createdAt   DateTime  @default(now())

  event     Event        @relation(fields: [eventId], references: [id], onDelete: Cascade)
  recipient EventMember  @relation("NotifRecipient", fields: [recipientId], references: [id], onDelete: Cascade)
  actor     EventMember? @relation("NotifActor",     fields: [actorId],     references: [id], onDelete: SetNull)
  item      Item?        @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([recipientId, readAt])
  @@index([eventId, recipientId])
}

model Invite {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eventId     String @db.Uuid
  token       String    @unique         // 暗号学的乱数で生成（ID とは別の秘密値）
  createdById String @db.Uuid
  expiresAt   DateTime?
  revokedAt   DateTime?
  createdAt   DateTime  @default(now())

  event     Event         @relation(fields: [eventId], references: [id], onDelete: Cascade)
  createdBy EventMember   @relation("InviteCreatedBy", fields: [createdById], references: [id])
  joins     EventMember[] @relation("InviteJoins")
}

enum EventStatus { DRAFT PUBLISHED }
enum Role        { OWNER MEMBER }
enum ItemKind    { SHARED RENTAL }
enum Size        { S M L }
enum NotifType   { ASK ACCEPTED DECLINED WITHDRAWN REQUEST_CANCELLED SHARED_ADDED MEMBER_JOINED SCHEDULE_CHANGED }
```

## ID の方針

- 全テーブルの主キーは `uuid` 型、既定値は `gen_random_uuid()`（DB側で生成）。Prisma 以外（ダッシュボード・SQL・supabase-js）からの INSERT でもIDが付く
- 外部キー列も全て `@db.Uuid`。参照先と型が一致しないとFKが張れない
- `authUid` も `uuid`。`auth.users` へのリレーションは張らない（`auth` スキーマは Prisma の管理外。`prisma migrate` で触らない）
- URL に載るIDは推測しにくいが秘密ではない。アクセス制御は必ず所属判定（`assertCan`）で行う
- 招待の `token` はIDと別に暗号学的乱数で生成する（`crypto.randomBytes(24).toString('base64url')` など）

## 外部キー一覧

| 子テーブル | FK列 | 参照先 | リレーション名 | onDelete | 必須 |
| --- | --- | --- | --- | --- | --- |
| Event | createdById | User.id | `EventCreatedBy` | Restrict | ○ |
| EventMember | eventId | Event.id | – | Cascade | ○ |
| EventMember | userId | User.id | – | Restrict | ○ |
| EventMember | invitedVia | Invite.id | `InviteJoins` | SetNull | – |
| Item | eventId | Event.id | – | Cascade | ○ |
| Item | requesterId | EventMember.id | `ItemRequester` | Restrict | RENTALのみ |
| Item | carrierId | EventMember.id | `ItemCarrier` | Restrict | – |
| Item | createdById | EventMember.id | `ItemCreatedBy` | Restrict | ○ |
| Item | sourceGearId | LendableGear.id | – | SetNull | – |
| LendableGear | eventId | Event.id | – | Cascade | ○ |
| LendableGear | memberId | EventMember.id | – | Cascade | ○ |
| Notification | eventId | Event.id | – | Cascade | ○ |
| Notification | recipientId | EventMember.id | `NotifRecipient` | Cascade | ○ |
| Notification | actorId | EventMember.id | `NotifActor` | SetNull | – |
| Notification | itemId | Item.id | – | Cascade | – |
| Invite | eventId | Event.id | – | Cascade | ○ |
| Invite | createdById | EventMember.id | `InviteCreatedBy` | Restrict | ○ |

**リレーション名が要る箇所** — 同じ2テーブル間に複数の経路があるとPrismaが曖昧性エラーを出すため、名前で区別する。

- `EventMember` → `Item` が3本（借り手 / 運搬担当 / 登録者）
- `EventMember` → `Notification` が2本（宛先 / 実行者）
- `EventMember` → `Invite` が2本（発行者 / 経由した参加）
- `User` → `Event`（作成者）は1本だが、後で他の経路が増えるため先に命名しておく

**onDelete の考え方**

- `Cascade` — 親が消えたら意味を失うもの（イベント配下の全て、アイテム配下の通知）
- `SetNull` — 参照が消えても本体は残すもの（退会メンバーが actor だった通知、貸せるギアが取り下げられたリクエスト）
- `Restrict` — 履歴の整合性上、参照されている限り消させないもの（借り手・登録者・発行者）。**メンバーは物理削除しない**ため、実運用でこの制約に当たることはない

> アイテム削除で関連通知は Cascade で消える。削除を知らせる `REQUEST_CANCELLED` は `itemId = null` で作り、品名を payload に残すことで Cascade の対象外にする。

## ステータスの導出

保存するのは事実のみ（担当・承諾）。表示ステータスは全て計算する。

```ts
function itemStatus(item) {
  if (item.carrierId && item.acceptedAt) return 'fixed';   // 確定
  if (item.carrierId)                    return 'asking';  // 引き受け確認中（宛先指定の依頼のみ）
  return item.kind === 'SHARED' ? 'unassigned' : 'open';   // 担当者募集中
}
```

早い者勝ちのため `pending`（確定待ち）と `clash`（重複・要調整）は廃止。

ダッシュボードの `packed / total` も集計値:
```sql
count(*) filter (where packed_at is not null), count(*)  -- group by event_id
```

## 割り当てのフロー

**早い者勝ちの確定は必ず条件付き更新で行う。** 同時に2人が押しても1人しか通らない。

```ts
const { count } = await prisma.item.updateMany({
  where: { id: itemId, carrierId: null },
  data:  { carrierId: me.id, acceptedAt: new Date() },
});
if (count === 0) throw new AlreadyTakenError(); // UI:「先に他の人が引き受けました」
```

**共同装備（SHARED）**
1. 誰でも追加 → `unassigned` + SHARED_ADDED 通知
2. 「自分が運ぶ」→ 条件付き更新で `carrierId = self, acceptedAt = now()` → `fixed`
3. 担当者が降りる → `carrierId = null, acceptedAt = null, packedAt = null` → `unassigned` + 全員に WITHDRAWN 通知

**貸し借り（RENTAL）**
1. 借り手がリクエストを作成（`requesterId = self`）。追加モーダルで宛先を選ぶ
   - 宛先あり（登録ギア宛）→ `carrierId = 所有者, acceptedAt = null` → `asking` + 所有者に ASK 通知
   - 宛先なし（募集）→ `open`
2. `open` への「貸せます」→ 条件付き更新で即確定 → `fixed` + 借り手に ACCEPTED 通知
3. `asking` を受けた所有者
   - 承諾 → `acceptedAt = now()` → `fixed` + 借り手に ACCEPTED 通知、ASK 通知の `resolvedAt` を埋める
   - 辞退 → `carrierId = null` → `open`（他の人が貸せる状態になる）+ 借り手に DECLINED 通知、ASK 通知の `resolvedAt` を埋める
4. 確定後に担当者が降りる → `carrierId = null, acceptedAt = null, packedAt = null` → `open` + 全員に WITHDRAWN 通知
5. 借り手が取り下げる → アイテム削除 + REQUEST_CANCELLED 通知

**辞退（DECLINED）と降りる（WITHDRAWN）の違い**
- DECLINED — 宛先指定の依頼を、まだ引き受けていない段階で断る。借り手にだけ知らせる
- WITHDRAWN — 一度確定した担当から降りる。誰かが代わりに運ぶ必要が生じるので全員に知らせる

## 通知の payload

サーバーは値だけ持ち、文面はクライアントで組む。

| type | 参照 | payload | 宛先 |
| --- | --- | --- | --- |
| `ASK` | itemId, actorId=借り手 | – | ギアの所有者 |
| `ACCEPTED` | itemId, actorId=担当者 | – | 借り手 |
| `DECLINED` | itemId, actorId=所有者 | `{ reason?: string }` | 借り手 |
| `WITHDRAWN` | itemId, actorId=降りた人 | `{ reason?: 'self' \| 'member_left' }` | actor 以外の全参加者 |
| `REQUEST_CANCELLED` | actorId、itemId = null | `{ itemName, reason: 'withdrawn' \| 'member_left' }` | actor 以外の全参加者 |
| `SHARED_ADDED` | itemId, actorId | – | actor 以外の全参加者 |
| `MEMBER_JOINED` | actorId | – | 既存の全参加者 |
| `SCHEDULE_CHANGED` | actorId | `{ field: 'date'\|'place', from, to }` | 全参加者 |

- `REQUEST_CANCELLED` は全参加者宛。宛先なしの募集は全員に見えていたため
- `time`（「12分前」）は `createdAt` からクライアントで相対表示
- 旧値が必要なのは SCHEDULE_CHANGED のみ。変更履歴テーブルは作らず payload にスナップショット
- イベント詳細のベルは `where eventId = ?`、通知ページは `where recipientId = ?` で同一テーブルを引く（データソース一本化）

## 権限（サーバー側で必ず検証 / RLS）

| 操作 | 許可 |
| --- | --- |
| 積載装備メモの編集 | 本人のみ |
| 「自分が運ぶ」「貸せます」 | 本人のみ（他人を指名不可）。`carrierId` が空の場合のみ |
| 担当から降りる | `carrierId` 本人のみ |
| 依頼の承諾・辞退 | `carrierId` 本人のみ（`acceptedAt` が null の場合） |
| 積み込み済みトグル | `carrierId` 本人のみ |
| 共同装備の追加 | 全参加者 |
| 貸し借りリクエストの作成 | 全参加者（`requesterId` = 本人） |
| アイテムの削除 | `createdById` または `requesterId` |
| イベントの編集・公開・メンバー削除・招待の発行と失効 | `OWNER` のみ（自分自身は削除不可） |
| イベントから退出 | 本人のみ。`OWNER` は退出不可（初版はオーナー移譲なし） |

いずれも「EventMember として当該イベントに所属しているか」を先に検証する — 条件は `eventId` 一致かつ `leftAt IS NULL`。離脱済みメンバーは読み取りを含めて全て不可。検証はサーバー側（`assertCan`）の1箇所のみで行う。

## DBアクセスの経路

- **DBの読み書きは Server Components / Server Actions + Prisma のみ**。ブラウザから DB へ直接アクセスする経路は持たない
- **Supabase の Data API は無効化する**（プロジェクト設定）。`supabase.from()` / `supabase.rpc()` は使わない
- **RLS ポリシーは書かない**。Data API を閉じるため不要。権限は全て `assertCan` で検証する
- Supabase は **Auth のみ**使用（Data API とは別サービスのため無効化の影響なし）
- 確認: マイグレーション後、`curl "https://<project>.supabase.co/rest/v1/User" -H "apikey: <anon key>"` でデータが返らないこと

## リアルタイム更新

初版では入れない。早い者勝ちの競合は条件付き更新で防げており、変化は通知で伝わるため。

- 操作した本人の画面: Server Action 内で `revalidatePath`
- 他人の変更: タブ復帰（`visibilitychange` / `focus`）で `router.refresh()`
- `AlreadyTakenError`: トースト表示 + `router.refresh()`
- 後から足す場合は **Broadcast**（Server Action の最後に `event:{eventId}` へ合図のみ送信 → クライアントは `router.refresh()`）。Postgres Changes は RLS ポリシーが必要でゲストが受信できないため使わない

## メンバーの離脱・再参加

`EventMember` は物理削除せず `leftAt` による論理削除とする。過去のアイテム・通知が参照するメンバーが消えないので、履歴が壊れない。

| 操作 | 処理 |
| --- | --- |
| 自分で退出 | `leftAt = now()` |
| オーナーがメンバーを削除 | `leftAt = now()` |
| 同じユーザーが再参加 | 既存レコードの `leftAt = null` に戻す（新規作成しない） |
| 参加中かどうかの判定 | 常に `where: { leftAt: null }` |

`@@unique([eventId, userId])` があるため、再参加で新規行を作ると衝突する。必ず `upsert` で既存行を復活させる。

```ts
// 参加（新規・再参加を兼ねる）
await prisma.eventMember.upsert({
  where:  { eventId_userId: { eventId, userId } },
  update: { leftAt: null, invitedVia: inviteId },
  create: { eventId, userId, isGuest, invitedVia: inviteId },
});

// 離脱
await prisma.eventMember.update({
  where: { id: memberId },
  data:  { leftAt: new Date() },
});
```

**離脱したメンバーの扱い**（1トランザクションで実行）

| 対象 | 挙動 |
| --- | --- |
| メンバー一覧・アバター列・参加人数 | 表示しない（`leftAt: null` で絞る） |
| 過去の通知の actor 名 | 表示する（履歴として残す） |
| 運搬担当だったアイテム | `carrierId` / `acceptedAt` / `packedAt` をクリアして募集中に戻す + WITHDRAWN 通知（`reason: 'member_left'`） |
| 借り手だったリクエスト | アイテムごと削除 + REQUEST_CANCELLED 通知（`reason: 'member_left'`） |
| 登録した貸せるギア | 削除する（このギア宛の依頼は `sourceGearId` が SetNull で募集扱いになる） |
| 登録した共同装備 | 残す（イベント全体の持ち物のため） |
| 宛先が本人の未読通知 | 残すが配信対象から外す |
| 全操作の権限 | 不可（所属判定で弾かれる） |

**再参加時**
- `gearMemo`・`role` は残っていた値をそのまま引き継ぐ
- 離脱中に解除された運搬担当は自動では戻さない（空いていれば再度「自分が運ぶ」で取れる）
- MEMBER_JOINED 通知は再参加でも発行する

## ゲスト参加の扱い

1. `/j/[token]` で Invite を検証（`expiresAt`, `revokedAt`）
2. 表示名の入力を必須にする（誰が誰か人間が判別できるように）
3. `User { authUid: null, claimTokenHash }` + `EventMember { isGuest: true }` を作成し、クレームトークン（平文）を httpOnly Cookie に保存
   - トークンは `crypto.randomBytes(32).toString('base64url')`、DB には SHA-256 ハッシュのみ保存
   - リクエストごとに Cookie の値をハッシュ化して `claimTokenHash` で `User` を引く
   - Cookie: `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'`
4. ゲストは通常メンバーと同じ操作が可能
5. 後からサインアップ → Cookie のトークンで既存 `User` に `authUid` を紐付け（`isGuest = false`、`claimTokenHash = null`、Cookie 削除）
   - 失効させたい場合は `claimTokenHash = null` にするだけで Cookie が無効になる
6. オーナーによる削除は `leftAt` のセット。同じリンクから入り直せば同一メンバーとして復帰する

### ゲスト → アカウントの引き継ぎ（`/claim`）

ゲスト Cookie を持った状態でログイン・登録したときに実行する。ゲストの User を `G`、アカウントの User を `A` とする。**全体を1トランザクションで行う。**

| ケース | 処理 |
| --- | --- |
| 新規登録で `A` がまだ無い | `G.authUid = auth.users.id`、`G.claimTokenHash = null`。`G` がそのままアカウントになる（`isGuest = false`） |
| 既存アカウント `A` でログイン | `G` のメンバー枠ごとに下記の「付け替え」または「統合」→ 最後に `G.claimTokenHash = null` |

**`A` がそのイベントに未参加 → 付け替え**
- `EventMember(G).userId = A.id`、`isGuest = false`。メンバー枠の ID は変わらないので、担当・リクエスト・通知はそのまま

**`A` が同じイベントに参加済み → 統合**（ゲスト枠 `Mg` を既存枠 `Ma` へまとめる）

| 対象 | 処理 |
| --- | --- |
| `Item.carrierId / requesterId / createdById = Mg` | `Ma` に付け替え |
| 付け替えで借り手と担当者が同じになる RENTAL | 自分から自分への貸し借りで意味がないため削除（通知なし） |
| `LendableGear.memberId = Mg` | `Ma` に付け替え |
| `Notification.recipientId = Mg` | `Ma` に付け替え |
| `Notification.actorId = Mg` | `Ma` に付け替え |
| `Invite.createdById = Mg` | `Ma` に付け替え |
| `role` | どちらかが `OWNER` なら `Ma.role = OWNER` |
| `gearMemo` | `Ma.gearMemo ?? Mg.gearMemo` |
| `Mg` 本体 | `leftAt = now()`（物理削除しない） |
| 通知 | 出さない（MEMBER_JOINED も出さない） |

- 統合は取り消せない。UI で確認を取る
- 処理後、`G` が参加中のメンバー枠を持たなくなっても `User` 行は残す（定期掃除の対象）
- 期限切れ（Cookie のトークンが一致しない）・引き継ぎ済み（`claimTokenHash = null`）は無効画面を出す

制約として認識しておくこと:
- 端末を変えると同一メンバーとして戻れない
- Cookie を失うと同じメンバーとして戻れず、別メンバーとして再参加になる（古い方をオーナーが離脱させる）
- 招待リンクの失効・無効化とメンバー削除は必須機能

## 実装順

1. Prisma スキーマ + Supabase マイグレーション、シード（現行プロトタイプのデータをそのまま投入）
2. Supabase の Data API を無効化 → 認証（Supabase Auth）とゲストクレーム、`EventMember` 解決のミドルウェア
3. 導出ロジックを共有モジュールに切り出す（`itemStatus`, 実効メモ, アバター色, 集計）— サーバー・クライアント両方から使う
4. 権限チェックを1箇所に集約（`assertCan(action, member, item)`）
5. 画面: プロフィール → ダッシュボード → イベント一覧・招待・参加 → イベント詳細 → 通知
