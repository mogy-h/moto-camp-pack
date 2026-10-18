import { z } from "zod";
import { AppError } from "@/lib/errors";

// Server Action の戻り値（CLAUDE.md 実装ルール 8）。例外を画面に投げず、必ずこの形で返す
//
// 使い方:
//   export async function carrySharedItem(input: unknown): Promise<ActionResult> {
//     try {
//       ...
//       return ok();
//     } catch (error) {
//       return toFailure(error);
//     }
//   }
export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export function ok(): ActionResult;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T): ActionResult<T | undefined> {
  return { ok: true, data };
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}

// catch したエラーを画面に返せる形にする。AppError と zod の検証エラーはメッセージをそのまま見せ、
// それ以外は中身を出さずにサーバーのログにだけ残す
export function toFailure(error: unknown): { ok: false; error: string } {
  if (error instanceof AppError) {
    return fail(error.message);
  }
  if (error instanceof z.ZodError) {
    return fail(error.issues[0]?.message ?? "入力内容を確認してください");
  }
  console.error(error);
  return fail("予期しないエラーが発生しました。時間をおいて、もう一度お試しください");
}
