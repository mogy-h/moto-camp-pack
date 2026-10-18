// 利用者に見せてよいメッセージを持つエラー。
// Server Action の中で投げ、最後に toFailure()（action-result.ts）で { ok: false, error } に変換する。
// それ以外のエラー（DB の接続断など）は中身を画面に出さない
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

// 早い者勝ちで負けたとき（条件付き更新の count === 0）。画面はトースト + router.refresh()
export class AlreadyTakenError extends AppError {
  constructor() {
    super("先に他の人が引き受けました");
  }
}

// requireMember: 参加していない、または離脱済み（leftAt が null でない）
export class NotMemberError extends AppError {
  constructor() {
    super("このイベントに参加していないため、操作できません");
  }
}

// assertCan: 参加はしているが、その操作の権限がない（docs/schema.md「権限」）
export class ForbiddenError extends AppError {
  constructor(message = "この操作を行う権限がありません") {
    super(message);
  }
}

// 対象が見つからない（他の人が先に削除した場合など）
export class NotFoundError extends AppError {
  constructor(message = "対象が見つかりません。削除された可能性があります") {
    super(message);
  }
}
