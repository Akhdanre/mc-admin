import { describe, expect, it } from "bun:test";
import { startBackupScheduler } from "@/server/services/backup";

describe("backup scheduler", () => {
  it("initializes scheduler singleton without error", () => {
    startBackupScheduler(60000);
    expect(globalThis.__mcBackupTimer).toBeDefined();
  });
});
