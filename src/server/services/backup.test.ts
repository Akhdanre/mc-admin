import { describe, expect, it } from "bun:test";
import { startBackupScheduler, getMsUntilTargetHour } from "@/server/services/backup";

describe("backup scheduler", () => {
  it("calculates positive delay until target hour", () => {
    const delay = getMsUntilTargetHour(5);
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it("initializes scheduler singleton without error", () => {
    startBackupScheduler(5);
    expect(globalThis.__mcBackupTimer).toBeDefined();
  });
});
