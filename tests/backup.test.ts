import { describe, expect, it } from "bun:test";
import {
  startBackupScheduler,
  getMsUntilTargetHour,
  formatSize,
  buildArchiveName,
  isBackupArchive,
  isSafeFilename,
  DEFAULT_RETENTION_DAYS,
} from "@/server/backup";

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

  it("formats file sizes cleanly", () => {
    expect(formatSize(500 * 1024 * 1024)).toBe("500.0 MB");
    expect(formatSize(1024 * 1024 * 1024)).toBe("1.00 GB");
    expect(formatSize(2.5 * 1024 * 1024 * 1024)).toBe("2.50 GB");
  });

  it("generates deterministic archive name with zero-padded timestamp", () => {
    const fixedDate = new Date(2026, 9, 31, 5, 2, 9); // Month index 9 = Oct
    const name = buildArchiveName(fixedDate);
    expect(name).toBe("world-backup-20261031-050209.tar.gz");
  });

  it("identifies valid backup archives while ignoring latest symlink", () => {
    expect(isBackupArchive("world-backup-20261031-050000.tar.gz")).toBe(true);
    expect(isBackupArchive("latest.tar.gz")).toBe(false);
    expect(isBackupArchive("backup.zip")).toBe(false);
    expect(isBackupArchive("notes.txt")).toBe(false);
  });

  it("guards against directory traversal in filenames", () => {
    expect(isSafeFilename("world-backup-20261031.tar.gz")).toBe(true);
    expect(isSafeFilename("../../../etc/passwd")).toBe(false);
    expect(isSafeFilename("subfolder/world.tar.gz")).toBe(false);
    expect(isSafeFilename("..\\win\\system32")).toBe(false);
    expect(isSafeFilename("")).toBe(false);
  });

  it("calculates retention cutoff accurately", () => {
    const nowMs = 1793400000000;
    const retentionMs = DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const cutoff = nowMs - retentionMs;

    const freshBackupMtime = nowMs - 2 * 24 * 60 * 60 * 1000;
    const expiredBackupMtime = nowMs - 10 * 24 * 60 * 60 * 1000;

    expect(nowMs - freshBackupMtime > retentionMs).toBe(false);
    expect(nowMs - expiredBackupMtime > retentionMs).toBe(true);
    expect(freshBackupMtime > cutoff).toBe(true);
    expect(expiredBackupMtime < cutoff).toBe(true);
  });
});
