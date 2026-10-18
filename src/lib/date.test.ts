import { describe, expect, it } from "vitest";
import { fromDateString, todayInTokyo, toDateString } from "@/lib/date";

describe("date helpers", () => {
  it("日本時間の 0 時を過ぎたら、UTC ではまだ前日でも翌日の日付になる", () => {
    const date = new Date("2024-06-01T00:00:00Z");
    const result = todayInTokyo(date);
    expect(result).toBe("2024-06-01");
    expect(todayInTokyo(new Date("2026-10-13T14:59:59Z"))).toBe("2026-10-13"); // 日本時間 23:59
    expect(todayInTokyo(new Date("2026-10-13T15:00:00Z"))).toBe("2026-10-14"); // 日本時間 0:00
  });

  it("toDateString はDateを YYYY-MM-DD 形式に変換する", () => {
    const date = new Date("2024-06-01T12:34:56Z");
    const result = toDateString(date);
    expect(result).toBe("2024-06-01");
  });

  it("fromDateString は YYYY-MM-DD を UTC 0 の Date に変換する", () => {
    const ymd = "2024-06-01";
    const result = fromDateString(ymd);
    expect(result.toISOString()).toBe("2024-06-01T00:00:00.000Z");
  });
});