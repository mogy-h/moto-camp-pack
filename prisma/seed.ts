// 開発用のサンプルデータ（docs/design の「富士山麓 1泊2日」）を投入する。`npx prisma db seed` で実行
// 何度実行しても同じ状態になるよう、既存データを全て消してから入れる
//
// デザインとスキーマが食い違う箇所はスキーマに合わせた:
// - 「初日夕食の食材」は担当なし（SHARED に承諾待ちの状態はないため。川瀬さんが降りた通知とも合う）
// - 「焚き火台」の ACCEPTED 通知は「シングルバーナー」に置き換え（ACCEPTED は貸し借りで借り手に送る通知のため）
// - 「ローチェア」（引き受け確認中）の依頼先として、山田さんの貸せるギアに「ローチェア」を追加
import { randomBytes } from "node:crypto";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { todayInTokyo } from "../src/lib/date";

// lib/prisma.ts は server-only を読み込むため Next.js の外では使えない。migrate と同じ DIRECT_URL で接続する
config({ path: ".env.local" });

function createPrismaClient() {
  const connectionString = process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DIRECT_URLが設定されていません");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// ログインできるサンプルのアカウント（開発用。パスワードは3人とも同じ）
const SEED_PASSWORD = "motocamp-dev";
const SEED_ACCOUNTS = {
  takuya: { email: "takuya@motocamp.test", displayName: "山田 拓也" },
  kenji: { email: "kenji@motocamp.test", displayName: "佐々木 健二" },
  misaki: { email: "misaki@motocamp.test", displayName: "川瀬 美咲" },
} as const;

type AuthUids = Record<keyof typeof SEED_ACCOUNTS, string>;

// Supabase Auth の管理用 API を呼ぶクライアント。Secret key は全権限を持つので、
// .env.local にだけ置き、NEXT_PUBLIC_ を付けず、Vercel にも入れない（シードは手元でしか実行しない）
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SECRET_KEY が設定されていません");
  }
  // ログインするためではなく管理用の API を呼ぶだけなので、セッションは保存しない
  return createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

// Auth のアカウントを用意し、その id（User.authUid に入れる値）を返す。
// resetAll は DB の表しか消さないので、2回目以降はアカウントが残っている。そのときは作り直さず、
// パスワードと表示名を上書きして、いつ実行しても同じ状態にする
async function ensureAuthUser(admin: SupabaseClient, account: { email: string; displayName: string }) {
  const attributes = {
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: account.displayName },
  };

  const { data, error } = await admin.auth.admin.createUser({ email: account.email, ...attributes });
  if (!error) return data.user.id;
  if (error.code !== "email_exists" && error.code !== "user_already_exists") throw error;

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;
  const existing = list.users.find((user) => user.email === account.email);
  if (!existing) throw new Error(`${account.email} のアカウントが見つかりません`);

  const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, attributes);
  if (updateError) throw updateError;
  return existing.id;
}

// date 列には「その日の UTC 0 時」の Date を渡す（docs/schema.md「文字列の長さ・日時の方針」）
function dateAfter(ymd: string, days: number) {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function minutesAgo(minutes: number) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => minutesAgo(days * 24 * 60);

type Size = "S" | "M" | "L";

// 子テーブルから順に消す（onDelete: Restrict の参照に当たらないように）
async function resetAll(tx: Prisma.TransactionClient) {
  await tx.notification.deleteMany();
  await tx.item.deleteMany();
  await tx.lendableGear.deleteMany();
  await tx.invite.deleteMany();
  await tx.eventMember.deleteMany();
  await tx.event.deleteMany();
  await tx.user.deleteMany();
}

async function seedFujiEvent(tx: Prisma.TransactionClient, authUids: AuthUids) {
  // authUid で Auth のアカウントと紐付けるので、SEED_ACCOUNTS のメールアドレスでログインできる
  const kenjiUser = await tx.user.create({
    data: {
      authUid: authUids.kenji,
      displayName: SEED_ACCOUNTS.kenji.displayName,
      bike: "CB400SF",
      gearMemo: "リアキャリア＋60Lシートバッグ、サイドバッグ左右",
    },
  });
  const misakiUser = await tx.user.create({
    data: {
      authUid: authUids.misaki,
      displayName: SEED_ACCOUNTS.misaki.displayName,
      bike: "Rebel 250",
      gearMemo: "タンデムシートに40Lバッグのみ",
    },
  });
  const takuyaUser = await tx.user.create({
    data: {
      authUid: authUids.takuya,
      displayName: SEED_ACCOUNTS.takuya.displayName,
      bike: "SEROW 250",
      gearMemo: "リアキャリア＋40Lバッグ、長物は横積み可",
    },
  });

  // 終了済みに見えないよう、日付は日本時間の今日から10日後の1泊2日にする
  const today = todayInTokyo();
  const startDate = dateAfter(today, 10);
  const startYmd = startDate.toISOString().slice(0, 10);
  const event = await tx.event.create({
    data: {
      title: "富士山麓 1泊2日 キャンプツーリング",
      place: "朝霧ジャンボリーオートキャンプ場",
      startDate,
      endDate: dateAfter(today, 11),
      status: "PUBLISHED",
      createdById: takuyaUser.id,
      createdAt: daysAgo(20),
    },
  });

  // オーナーは山田さん（デザインの既定の視点）
  const takuya = await tx.eventMember.create({
    data: { eventId: event.id, userId: takuyaUser.id, role: "OWNER", joinedAt: daysAgo(20) },
  });

  const activeInvite = await tx.invite.create({
    data: {
      eventId: event.id,
      token: randomBytes(16).toString("base64url"),
      createdById: takuya.id,
      expiresAt: new Date(`${startYmd}T23:59:59+09:00`),
      createdAt: daysAgo(10),
    },
  });
  await tx.invite.create({
    data: {
      eventId: event.id,
      token: randomBytes(16).toString("base64url"),
      createdById: takuya.id,
      revokedAt: daysAgo(12),
      createdAt: daysAgo(17),
    },
  });

  const kenji = await tx.eventMember.create({
    data: { eventId: event.id, userId: kenjiUser.id, invitedVia: activeInvite.id, joinedAt: daysAgo(9) },
  });
  const misaki = await tx.eventMember.create({
    data: { eventId: event.id, userId: misakiUser.id, invitedVia: activeInvite.id, joinedAt: daysAgo(2) },
  });

  await tx.lendableGear.createMany({
    data: [
      { eventId: event.id, memberId: takuya.id, name: "予備グローブ", size: "S" },
      { eventId: event.id, memberId: kenji.id, name: "ランタンスタンド", size: "M" },
    ],
  });
  const lowChair = await tx.lendableGear.create({
    data: { eventId: event.id, memberId: takuya.id, name: "ローチェア", size: "M" },
  });

  // 表示順を安定させるため、作成日時を10分ずつずらす
  let order = 0;
  const nextCreatedAt = () => minutesAgo(30 * 60 - 10 * order++);

  // 共同装備: carrier を渡すと確定済み、渡さないと担当者募集中
  const shared = async (name: string, size: Size, createdById: string, carrier?: { id: string; packed: boolean }) => {
    const createdAt = nextCreatedAt();
    return tx.item.create({
      data: {
        eventId: event.id,
        kind: "SHARED",
        name,
        size,
        createdById,
        carrierId: carrier?.id,
        acceptedAt: carrier ? createdAt : undefined,
        packedAt: carrier?.packed ? createdAt : undefined,
        createdAt,
      },
    });
  };

  await shared("ヘキサタープ + ポール", "L", takuya.id, { id: takuya.id, packed: true });
  await shared("焚き火台 + ゴトク", "M", kenji.id, { id: kenji.id, packed: false });
  const dinner = await shared("初日夕食の食材", "M", takuya.id);
  await shared("クッカーセット", "S", misaki.id, { id: misaki.id, packed: true });
  const firewood = await shared("炭・薪", "L", kenji.id);
  await shared("LEDランタン ×2", "S", takuya.id);

  // 貸し借り: lender.accepted で確定（fixed）/ 引き受け確認中（asking）、lender なしで募集中（open）。登録者は借り手
  const rental = async (
    name: string,
    size: Size,
    requesterId: string,
    lender?: { id: string; accepted: boolean; sourceGearId?: string },
  ) => {
    const createdAt = nextCreatedAt();
    return tx.item.create({
      data: {
        eventId: event.id,
        kind: "RENTAL",
        name,
        size,
        requesterId,
        createdById: requesterId,
        carrierId: lender?.id,
        acceptedAt: lender?.accepted ? createdAt : undefined,
        sourceGearId: lender?.sourceGearId,
        createdAt,
      },
    });
  };

  await rental("シュラフ（冬用 -5℃）", "M", misaki.id, { id: takuya.id, accepted: true });
  const chairRequest = await rental("ローチェア", "M", kenji.id, {
    id: takuya.id,
    accepted: false,
    sourceGearId: lowChair.id,
  });
  const mat = await rental("インフレータブルマット", "L", misaki.id);
  const burner = await rental("シングルバーナー", "S", takuya.id, { id: misaki.id, accepted: true });
  await rental("ランタン（充電式）", "S", takuya.id);

  // 通知はデザインの視点（山田さん）宛てのみ。文面は保存しない（type + 参照ID + payload）
  const toTakuya = { eventId: event.id, recipientId: takuya.id };
  await tx.notification.createMany({
    data: [
      { ...toTakuya, type: "ASK", actorId: kenji.id, itemId: chairRequest.id, createdAt: minutesAgo(12) },
      {
        ...toTakuya,
        type: "WITHDRAWN",
        actorId: kenji.id,
        itemId: mat.id,
        payload: { reason: "self" },
        createdAt: minutesAgo(40),
      },
      { ...toTakuya, type: "ACCEPTED", actorId: misaki.id, itemId: burner.id, createdAt: hoursAgo(2) },
      {
        ...toTakuya,
        type: "WITHDRAWN",
        actorId: misaki.id,
        itemId: dinner.id,
        payload: { reason: "self" },
        createdAt: hoursAgo(20),
        readAt: hoursAgo(19),
      },
      {
        ...toTakuya,
        type: "SHARED_ADDED",
        actorId: kenji.id,
        itemId: firewood.id,
        createdAt: firewood.createdAt,
        readAt: hoursAgo(19),
      },
      { ...toTakuya, type: "MEMBER_JOINED", actorId: misaki.id, createdAt: daysAgo(2), readAt: daysAgo(1) },
    ],
  });
}

async function main() {
  // Auth のアカウントは、DB のトランザクションを始める前に用意する
  // （外部の API の応答を待つ間、トランザクションを開いたままにしないため）
  const admin = createAdminClient();
  const authUids: AuthUids = {
    takuya: await ensureAuthUser(admin, SEED_ACCOUNTS.takuya),
    kenji: await ensureAuthUser(admin, SEED_ACCOUNTS.kenji),
    misaki: await ensureAuthUser(admin, SEED_ACCOUNTS.misaki),
  };

  const prisma = createPrismaClient();
  try {
    await prisma.$transaction(
      async (tx) => {
        await resetAll(tx);
        await seedFujiEvent(tx, authUids);
      },
      { timeout: 60 * 1000 },
    );
    console.log(`シードを投入しました（ログイン: ${SEED_ACCOUNTS.takuya.email} / ${SEED_PASSWORD} など）`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
