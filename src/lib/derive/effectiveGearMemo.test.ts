import { describe, it, expect } from "vitest";
import { effectiveGearMemo } from "@/lib/derive/effectiveGearMemo";

describe("effectiveGearMemo", () => {
  it("メンバーとしてのメモとプロフィールにもメモがある場合、メンバーとしてのメモを使用する", () => {
    const member = { gearMemo: "パニア2個" };
    const user = { gearMemo: "シートバッグ" };
    expect(effectiveGearMemo(member, user)).toBe("パニア2個");
  });
  it("メンバーとしてのメモがなく、プロフィールにある場合プロフィールのメモを使用する", () => {
    const member = { gearMemo: null };
    const user = { gearMemo: "シートバッグ" };
    expect(effectiveGearMemo(member, user)).toBe("シートバッグ");
  });
  it("どちらのメモもない場合", () => {
    const member = { gearMemo: null };
    const user = { gearMemo: null };
    expect(effectiveGearMemo(member, user)).toBe(null);
  });
});
