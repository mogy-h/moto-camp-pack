import { describe, it, expect } from "vitest";
import { inviteStatus } from "@/lib/derive/inviteStatus";

const before = new Date("2026-11-09T00:00:00+09:00");
const now = new Date("2026-11-10T00:00:00+09:00");
const after = new Date("2026-11-11T00:00:00+09:00");

describe("inviteStatus", () => {
  it("招待リンクが有効で、期限が設定されていない場合 valid", () => {
    expect(inviteStatus({ revokedAt: null, expiresAt: null }, now)).toBe(
      "valid",
    );
  });
  it("招待リンクが無効化されていて、期限が設定されていない場合 revoked", () => {
    expect(inviteStatus({ revokedAt: now, expiresAt: null }, now)).toBe(
      "revoked",
    );
  });
  it("招待リンクが有効で、期限内の場合 valid", () => {
    expect(inviteStatus({ revokedAt: null, expiresAt: after }, now)).toBe(
      "valid",
    );
  });
  it("招待リンクが有効で、期限が切れている場合 expired", () => {
    expect(inviteStatus({ revokedAt: null, expiresAt: before }, now)).toBe(
      "expired",
    );
  });
  it("招待リンクが有効で、たった今期限切れになった場合 expired", () => {
    expect(inviteStatus({ revokedAt: null, expiresAt: now }, now)).toBe(
      "expired",
    );
  });
  it("招待リンクが無効で、期限が切れている場合 revoked を優先", () => {
    expect(inviteStatus({ revokedAt: now, expiresAt: before }, now)).toBe(
      "revoked",
    );
  });
});
