import { describe, expect, it } from "bun:test";
import {
  DEFAULT_RESTART_CONFIG,
  getMsUntilDailyTarget,
  formatDuration,
} from "@/server/restart/time";
import { getRestartConfig, saveRestartConfig, getRestartStatus } from "@/server/restart";

describe("restart time calculations", () => {
  it("calculates positive delay until future daily target", () => {
    // 04:00 UTC target from a known point in time
    const fixedNow = new Date("2026-11-01T02:00:00Z");
    const delay = getMsUntilDailyTarget(4, 0, fixedNow);

    // Exactly 2 hours = 7,200,000 ms
    expect(delay).toBe(2 * 60 * 60 * 1000);
  });

  it("rolls over to tomorrow when target hour has already passed", () => {
    // Current time is 06:00 UTC, target is 04:00 UTC
    const fixedNow = new Date("2026-11-01T06:00:00Z");
    const delay = getMsUntilDailyTarget(4, 0, fixedNow);

    // Exactly 22 hours = 79,200,000 ms
    expect(delay).toBe(22 * 60 * 60 * 1000);
  });

  it("handles exact same minute by rolling over to 24h", () => {
    const fixedNow = new Date("2026-11-01T04:00:00Z");
    const delay = getMsUntilDailyTarget(4, 0, fixedNow);

    // Should schedule for next day (24h)
    expect(delay).toBe(24 * 60 * 60 * 1000);
  });

  it("formats duration into human-readable strings", () => {
    expect(formatDuration(0)).toBe("now");
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(125)).toBe("2m 5s");
    expect(formatDuration(3665)).toBe("1h 1m");
    expect(formatDuration(70560)).toBe("19h 36m");
  });
});

describe("restart config service", () => {
  it("provides valid default restart config", async () => {
    const cfg = await getRestartConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.hour).toBe(DEFAULT_RESTART_CONFIG.hour);
    expect(cfg.minute).toBe(DEFAULT_RESTART_CONFIG.minute);
    expect(cfg.warningSeconds).toBe(60);
    expect(cfg.timezone).toBe("UTC");
  });

  it("updates and persists in-memory restart schedule", async () => {
    const updated = await saveRestartConfig({
      hour: 5,
      minute: 30,
      warningSeconds: 30,
    });

    expect(updated.hour).toBe(5);
    expect(updated.minute).toBe(30);
    expect(updated.warningSeconds).toBe(30);

    const status = await getRestartStatus();
    expect(status.config.hour).toBe(5);
    expect(status.config.minute).toBe(30);
    expect(status.secondsUntilNext).toBeGreaterThan(0);
    expect(status.nextRestartIso).not.toBeNull();
  });
});
