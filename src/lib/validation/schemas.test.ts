import { describe, expect, it } from "vitest";
import { createEventSchema, fields, signInSchema } from "@/lib/validation/schemas";

describe("必須の文字列", () => {
  it("前後の空白を除く", () => {
    expect(fields.displayName.parse("  山田 拓也  ")).toBe("山田 拓也");
  });

  it("空白だけなら未入力として弾く", () => {
    expect(fields.displayName.safeParse("   ").success).toBe(false);
  });

  it("文字数は「文字」単位で数える（絵文字も1文字）", () => {
    expect(fields.displayName.safeParse("あ".repeat(20)).success).toBe(true);
    expect(fields.displayName.safeParse("あ".repeat(21)).success).toBe(false);
    expect(fields.displayName.safeParse("🏍".repeat(20)).success).toBe(true);
  });
});

describe("任意の文字列", () => {
  it("空・空白だけ・未指定は null にする", () => {
    expect(fields.bike.parse("")).toBeNull();
    expect(fields.bike.parse("   ")).toBeNull();
    expect(fields.bike.parse(undefined)).toBeNull();
    expect(fields.bike.parse(null)).toBeNull();
  });

  it("上限を超えたら弾く", () => {
    expect(fields.bike.safeParse("a".repeat(31)).success).toBe(false);
  });
});

describe("createEventSchema", () => {
  const today = "2026-10-17";
  const base = { title: "富士山麓 1泊2日", place: "", bike: "", gearMemo: "" };

  it("日帰り（出発日 = 帰着日 = 今日）は通る", () => {
    const result = createEventSchema(today).safeParse({ ...base, startDate: today, endDate: today });
    expect(result.success).toBe(true);
    expect(result.data?.place).toBeNull();
  });

  it("出発日が昨日なら弾く", () => {
    const result = createEventSchema(today).safeParse({ ...base, startDate: "2026-10-16", endDate: today });
    expect(result.error?.issues[0].path).toEqual(["startDate"]);
  });

  it("帰着日が出発日より前なら弾く", () => {
    const result = createEventSchema(today).safeParse({ ...base, startDate: "2026-10-20", endDate: "2026-10-19" });
    expect(result.error?.issues[0].path).toEqual(["endDate"]);
  });

  it("存在しない日付は弾く", () => {
    expect(createEventSchema(today).safeParse({ ...base, startDate: "2027-02-30", endDate: "2027-03-01" }).success).toBe(
      false,
    );
  });
});

describe("signInSchema", () => {
  it("ログインではパスワードの文字数を確かめない", () => {
    expect(signInSchema.safeParse({ email: "a@example.com", password: "short" }).success).toBe(true);
  });
});
