import { z } from "zod";
import { LIMITS } from "@/lib/validation/limits";

// 入力の検証（docs/screens.md「入力項目の制約」）。共通ルール:
// - 前後の空白を除いてから判定する。空白だけなら未入力
// - 任意項目が空なら null にする（DB に null で保存する）
// - 文字数は「文字」単位で数える（Array.from で数え、絵文字も1文字にする。zod の .max() は UTF-16 の単位で数えるため使わない）

const charLength = (value: string) => Array.from(value).length;

function requiredText(label: string, max: number) {
  return z
    .string(`${label}を入力してください`)
    .trim()
    .min(1, `${label}を入力してください`)
    .refine((value) => charLength(value) <= max, `${label}は${max}文字以内で入力してください`);
}

function optionalText(label: string, max: number) {
  return z
    .string()
    .trim()
    .refine((value) => charLength(value) <= max, `${label}は${max}文字以内で入力してください`)
    .nullish()
    .transform((value) => (value ? value : null));
}

// "YYYY-MM-DD"（<input type="date"> の値）。存在しない日付（2/30 など）も弾く
function dateString(label: string) {
  return z.iso.date(`${label}を正しく入力してください`);
}

// 1項目ずつのスキーマ。画面や Action の組み合わせに合わせて下の z.object で使う
export const fields = {
  id: z.uuid("不正な ID です"),
  displayName: requiredText("表示名", LIMITS.displayName),
  email: z
    .string("メールアドレスを入力してください")
    .trim()
    .pipe(
      z
        .email("メールアドレスの形式で入力してください")
        .max(LIMITS.email, `メールアドレスは${LIMITS.email}文字以内で入力してください`),
    ),
  // パスワードは空白も含めて本人が決めた値なので、前後の空白を除かない
  password: z
    .string("パスワードを入力してください")
    .min(LIMITS.passwordMin, `パスワードは${LIMITS.passwordMin}文字以上で入力してください`)
    .max(LIMITS.passwordMax, `パスワードは${LIMITS.passwordMax}文字以内で入力してください`),
  bike: optionalText("車種", LIMITS.bike),
  gearMemo: optionalText("積載装備のメモ", LIMITS.gearMemo),
  eventTitle: requiredText("イベント名", LIMITS.eventTitle),
  eventPlace: optionalText("目的地", LIMITS.eventPlace),
  startDate: dateString("出発日"),
  endDate: dateString("帰着日"),
  gearName: requiredText("ギア名", LIMITS.gearName),
  size: z.enum(["S", "M", "L"], "サイズを選んでください").default("M"),
  searchKeyword: optionalText("検索キーワード", LIMITS.searchKeyword),
};

export const signUpSchema = z.object({
  displayName: fields.displayName,
  email: fields.email,
  password: fields.password,
  agreedToTerms: z.literal(true, "利用規約への同意が必要です"),
});

// ログインでは文字数を確かめない（登録済みのパスワードを、今の規則で弾かないため）
export const signInSchema = z.object({
  email: fields.email,
  password: z.string("パスワードを入力してください").min(1, "パスワードを入力してください"),
});

// 「今日」は呼び出し側で todayInTokyo() を求めて渡す（実装ルール 13）
export function createEventSchema(today: string) {
  return z
    .object({
      title: fields.eventTitle,
      place: fields.eventPlace,
      startDate: fields.startDate,
      endDate: fields.endDate,
      bike: fields.bike, // プロフィール（User.bike）へ保存
      gearMemo: fields.gearMemo, // このイベントの EventMember.gearMemo
    })
    .refine((input) => input.startDate >= today, {
      message: "出発日は今日以降の日付を選んでください",
      path: ["startDate"],
    })
    .refine((input) => input.endDate >= input.startDate, {
      message: "帰着日は出発日以降の日付を選んでください",
      path: ["endDate"],
    });
}

// 共同装備の追加・借りたいギア・貸せるギア・アイテム編集で共通
export const itemSchema = z.object({
  name: fields.gearName,
  size: fields.size,
});

export const updateEventGearMemoSchema = z.object({
  eventId: fields.id,
  gearMemo: fields.gearMemo,
});
