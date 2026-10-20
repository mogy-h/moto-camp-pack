import { describe, it, expect } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it("半角スペース入りの名前から最初の2文字を返す", () => {
    expect(initials("佐々木 健二")).toBe("佐々");
  });

  it("全角スペース入りの名前から最初の2文字を返す", () => {
    expect(initials("佐々木　健二")).toBe("佐々");
  });

  it("英字の名前から最初の2文字を返す", () => {
    expect(initials("Takuya Yamada")).toBe("Ta");
  });

  it("1文字の名前はそのまま返す", () => {
    expect(initials("健")).toBe("健");
  });
});
