import "server-only";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "@/server/core";
import { executeRconCommand } from "@/server/rcon";
import {
  BACKUP_CONFIG_FILE,
  DEFAULT_RETENTION_DAYS,
  LATEST_LINK,
  buildArchiveName,
  getMsUntilTargetHour,
  formatSize,
  isBackupArchive,
  isSafeFilename,
} from "./time";
import type {
  BackupStatusResponse,
  BackupTriggerResponse,
  BackupDeleteResponse,
  BackupRetentionResponse,
  BackupRestoreResponse,
  BackupItem,
} from "@/types";

const execAsync = promisify(exec);

async function loadRetentionConfig(): Promise<number> {
  try {
    const raw = await fs.readFile(path.join(config.paths.backups, BACKUP_CONFIG_FILE), "utf-8");
    const parsed = JSON.parse(raw);
    return Number(parsed.retentionDays) || DEFAULT_RETENTION_DAYS;
  } catch {
    return DEFAULT_RETENTION_DAYS;
  }
}

async function saveRetentionConfig(days: number): Promise<number> {
  const cfg = { retentionDays: Math.trunc(days) };
  await fs.writeFile(
    path.join(config.paths.backups, BACKUP_CONFIG_FILE),
    JSON.stringify(cfg, null, 2),
    "utf-8"
  );
  return cfg.retentionDays;
}

export async function getBackupStatus(): Promise<BackupStatusResponse> {
  const updatedAt = new Date().toLocaleTimeString();

  try {
    const backupDir = config.paths.backups;
    const files = await fs.readdir(backupDir);

    let latestTarget: string | null = null;
    try {
      latestTarget = path.basename(await fs.readlink(path.join(backupDir, LATEST_LINK)));
    } catch {
      // symlink might not exist
    }

    const items: BackupItem[] = [];
    let totalSizeBytes = 0;

    for (const file of files) {
      if (!isBackupArchive(file)) continue;

      try {
        const filePath = path.join(backupDir, file);
        const stat = await fs.stat(filePath);
        totalSizeBytes += stat.size;

        items.push({
          filename: file,
          sizeBytes: stat.size,
          sizeFormatted: formatSize(stat.size),
          mtime: stat.mtimeMs / 1000,
          createdAt: stat.mtime.toISOString(),
          isLatest: file === latestTarget,
        });
      } catch {
        // Skip inaccessible files
      }
    }

    items.sort((a, b) => b.mtime - a.mtime);
    if (items.length > 0 && !items.some((i) => i.isLatest) && items[0]) {
      items[0].isLatest = true;
    }

    const retentionDays = await loadRetentionConfig();

    return {
      backups: items,
      totalCount: items.length,
      totalSizeBytes,
      totalSizeFormatted: formatSize(totalSizeBytes),
      retentionDays,
      latestBackup: items[0] || null,
      updatedAt,
    };
  } catch (err: unknown) {
    return {
      backups: [],
      totalCount: 0,
      totalSizeBytes: 0,
      totalSizeFormatted: "0 MB",
      retentionDays: 7,
      latestBackup: null,
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}

export async function deleteBackup(filename: string): Promise<BackupDeleteResponse> {
  if (!isSafeFilename(filename)) {
    return { success: false, error: "Invalid filename" };
  }

  const backupDir = config.paths.backups;
  const target = path.join(backupDir, filename);

  try {
    await fs.unlink(target);

    // Refresh symlink if deleted file was latest
    const files = await fs.readdir(backupDir);
    const tarFiles = files.filter(isBackupArchive);
    const symlinkPath = path.join(backupDir, LATEST_LINK);

    try {
      await fs.unlink(symlinkPath);
    } catch {
      // Ignore if symlink didn't exist
    }

    if (tarFiles.length > 0) {
      const stats = await Promise.all(
        tarFiles.map(async (f) => ({
          name: f,
          mtime: (await fs.stat(path.join(backupDir, f))).mtimeMs,
        }))
      );
      stats.sort((a, b) => b.mtime - a.mtime);
      if (stats[0]) {
        await fs.symlink(stats[0].name, symlinkPath);
      }
    }
    return { success: true, deleted: filename };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setRetention(days: number): Promise<BackupRetentionResponse> {
  try {
    const retentionDays = await saveRetentionConfig(days);
    return { success: true, retentionDays };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Creates an immediate world backup directly into the backup volume:
 * 1. Flushes Minecraft memory to disk via RCON (save-off -> save-all flush)
 * 2. Archives /data into a compressed .tar.gz archive in /backups
 * 3. Re-enables server autosaving (save-on)
 * 4. Updates latest.tar.gz symlink and auto-prunes backups past retention days
 */
export async function triggerBackup(): Promise<BackupTriggerResponse> {
  const triggeredAt = new Date().toLocaleTimeString();

  try {
    const backupDir = config.paths.backups;
    const dataDir = config.paths.data;

    await fs.mkdir(backupDir, { recursive: true });

    // 1. Tell Minecraft to flush world state
    try {
      await executeRconCommand("save-off");
      await executeRconCommand("save-all flush");
    } catch (rconErr) {
      console.warn("RCON flush warning (continuing backup):", rconErr);
    }

    // 2. Generate timestamped archive
    const archiveName = buildArchiveName();
    const archivePath = path.join(backupDir, archiveName);

    try {
      // Archive /data into archivePath
      await execAsync(`tar -czf "${archivePath}" -C "${dataDir}" .`, { timeout: 300000 });
    } finally {
      // Always re-enable server saving
      try {
        await executeRconCommand("save-on");
      } catch {
        // ignore
      }
    }

    // 3. Update latest symlink
    const symlinkPath = path.join(backupDir, LATEST_LINK);
    try {
      await fs.unlink(symlinkPath);
    } catch {
      // ignore
    }
    try {
      await fs.symlink(archiveName, symlinkPath);
    } catch {
      // ignore
    }

    // 4. Prune older backups according to retention policy
    try {
      await pruneBackups();
    } catch (pruneErr) {
      console.warn("Failed to prune expired backups:", pruneErr);
    }

    const stat = await fs.stat(archivePath);

    return {
      success: true,
      output: `Created ${archiveName} (${formatSize(stat.size)})`,
      triggeredAt,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
      triggeredAt,
    };
  }
}

/**
 * Restores / rolls back world data from an existing backup archive (.tar.gz):
 * 1. Checks backup file existence
 * 2. Attempts to stop autosave and alert players via RCON
 * 3. Extracts tar archive over the data directory
 */
export async function restoreBackup(filename: string): Promise<BackupRestoreResponse> {
  if (!isSafeFilename(filename)) {
    return { success: false, error: "Invalid filename" };
  }

  const backupDir = config.paths.backups;
  const dataDir = config.paths.data;
  const archivePath = path.join(backupDir, filename);

  try {
    await fs.access(archivePath);
  } catch {
    return { success: false, error: "Backup archive file not found" };
  }

  try {
    try {
      await executeRconCommand("say [SERVER] World rollback in progress...");
      await executeRconCommand("save-off");
    } catch {
      // RCON might be offline if server is stopped
    }

    // Extract archive over target data directory
    await execAsync(`tar -xzf "${archivePath}" -C "${dataDir}"`, { timeout: 300000 });

    return {
      success: true,
      restored: filename,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function pruneBackups(): Promise<void> {
  const retentionDays = await loadRetentionConfig();
  const backupDir = config.paths.backups;
  const files = await fs.readdir(backupDir);
  const nowMs = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (!isBackupArchive(file)) continue;

    const filePath = path.join(backupDir, file);
    try {
      const stat = await fs.stat(filePath);
      if (nowMs - stat.mtimeMs > maxAgeMs) {
        await fs.unlink(filePath);
      }
    } catch {
      // ignore
    }
  }
}

declare global {
  var __mcBackupTimer: NodeJS.Timeout | undefined;
}

export function startBackupScheduler(targetHour = 5): void {
  if (globalThis.__mcBackupTimer) return;

  const delay = getMsUntilTargetHour(targetHour);
  console.log(
    `[BackupScheduler] Scheduled daily auto backup at ${String(targetHour).padStart(2, "0")}:00 (in ${(delay / 3600000).toFixed(1)}h)`
  );

  globalThis.__mcBackupTimer = setTimeout(() => {
    const runBackup = async () => {
      try {
        console.log("[BackupScheduler] Triggering scheduled world backup...");
        const res = await triggerBackup();
        if (res.success) {
          console.log(`[BackupScheduler] Scheduled backup finished: ${res.output}`);
        } else {
          console.error(`[BackupScheduler] Scheduled backup failed: ${res.error}`);
        }
      } catch (err) {
        console.error("[BackupScheduler] Error running scheduled backup:", err);
      }
    };

    runBackup();
    globalThis.__mcBackupTimer = setInterval(runBackup, 24 * 60 * 60 * 1000);
  }, delay);
}
