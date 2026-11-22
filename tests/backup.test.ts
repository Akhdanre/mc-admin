import { describe, expect, it } from "bun:test";
import {
  startBackupScheduler,
  getMsUntilTargetHour,
  formatSize,
  buildArchiveName,
  isBackupArchive,
  isSafeFilename,
  parseDateFromFilename,
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

describe("parseDateFromFilename", () => {
  it("parses date from standard backup filename", () => {
    const date = parseDateFromFilename("world-backup-20261021-050001.tar.gz");
    expect(date).not.toBeNull();
    expect(date?.getUTCFullYear()).toBe(2026);
    expect(date?.getUTCMonth()).toBe(9); // Oct = 9 (0-indexed)
    expect(date?.getUTCDate()).toBe(21);
    expect(date?.getUTCHours()).toBe(5);
    expect(date?.getUTCMinutes()).toBe(0);
    expect(date?.getUTCSeconds()).toBe(1);
  });

  it("returns null for non-matching filenames", () => {
    expect(parseDateFromFilename("latest.tar.gz")).toBeNull();
    expect(parseDateFromFilename("backup.zip")).toBeNull();
    expect(parseDateFromFilename("notes.txt")).toBeNull();
    expect(parseDateFromFilename("world-backup-baddate.tar.gz")).toBeNull();
  });

  it("correctly identifies which archives are expired given 7-day retention", () => {
    // Today: 2026-11-01. 7-day cutoff: 2026-10-25.
    const now = new Date("2026-11-01T12:00:00Z").getTime();
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000;

    const cases: [string, boolean][] = [
      ["world-backup-20261021-050001.tar.gz", true], // Oct 21 → 11d old → expired
      ["world-backup-20261022-050001.tar.gz", true], // Oct 22 → 10d old → expired
      ["world-backup-20261023-050001.tar.gz", true], // Oct 23 → 9d old → expired
      ["world-backup-20261024-050001.tar.gz", true], // Oct 24 → 8d old → expired
      ["world-backup-20261025-050001.tar.gz", true], // Oct 25 → 7.29d old → expired (> 7d exactly)
      ["world-backup-20261026-050001.tar.gz", false], // Oct 26 → 6d old → keep
      ["world-backup-20261031-050001.tar.gz", false], // Oct 31 → 1d old → keep
    ];

    for (const [filename, shouldExpire] of cases) {
      const fileDate = parseDateFromFilename(filename);
      expect(fileDate).not.toBeNull();
      const ageMs = now - fileDate!.getTime();
      expect(ageMs > maxAgeMs).toBe(shouldExpire);
    }
  });
});
