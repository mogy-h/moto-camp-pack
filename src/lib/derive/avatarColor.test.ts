import { describe, it, expect } from "vitest";
import { avatarColor, AVATAR_COLORS } from "./avatarColor";

// どの色になるかを手で計算しなくて済むよう、具体的な色ではなく「性質」を確かめる。
// UUID の形をした id を 100 個用意する（末尾の数字だけが違う）
const userIds = Array.from(
  { length: 100 },
  (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
);

describe("avatarColor", () => {
  it("同じ userId なら何回呼んでも同じ結果になる", () => {
    expect(avatarColor("6e5947b2-3175-4f64-acfe-0e17572818f3")).toBe(
      avatarColor("6e5947b2-3175-4f64-acfe-0e17572818f3"),
    );
  });

  it("結果は必ずパレットのどれかになる", () => {
    for (const userId of userIds) {
      expect(AVATAR_COLORS).toContain(avatarColor(userId));
    }
  });

  // いつも同じ色を返すバグや、割る数を間違えて使われない色が出るバグを見つける
  it("100人いれば、パレットの全色が使われる", () => {
    const colors = new Set(userIds.map(avatarColor));
    expect(colors.size).toBe(AVATAR_COLORS.length);
  });
});
