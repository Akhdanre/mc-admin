import "server-only";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "@/server/config";
import { executeRconCommand } from "@/server/services/rcon";
import type {
  BackupStatusResponse,
  BackupTriggerResponse,
  BackupDeleteResponse,
  BackupRetentionResponse,
  BackupItem,
} from "@/types";

const execAsync = promisify(exec);

const LATEST_LINK = "latest.tar.gz";
const CONFIG_FILE = "backup_config.json";
const DEFAULT_RETENTION_DAYS = 7;

function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

async function loadRetentionConfig(): Promise<number> {
  try {
    const raw = await fs.readFile(path.join(config.paths.backups, CONFIG_FILE), "utf-8");
    const parsed = JSON.parse(raw);
    return Number(parsed.retentionDays) || DEFAULT_RETENTION_DAYS;
  } catch {
    return DEFAULT_RETENTION_DAYS;
  }
}

async function saveRetentionConfig(days: number): Promise<number> {
  const cfg = { retentionDays: Math.trunc(days) };
  await fs.writeFile(
    path.join(config.paths.backups, CONFIG_FILE),
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
      if (!file.endsWith(".tar.gz") || file === LATEST_LINK) continue;

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
    if (items.length > 0 && !items.some((i) => i.isLatest)) {
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
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return { success: false, error: "Invalid filename" };
  }

  const backupDir = config.paths.backups;
  const target = path.join(backupDir, filename);

  try {
    await fs.unlink(target);

    // Refresh symlink if deleted file was latest
    const files = await fs.readdir(backupDir);
    const tarFiles = files.filter((f) => f.endsWith(".tar.gz") && f !== LATEST_LINK);
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
      await fs.symlink(stats[0].name, symlinkPath);
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
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    const archiveName = `world-backup-${timestamp}.tar.gz`;
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

async function pruneBackups(): Promise<void> {
  const retentionDays = await loadRetentionConfig();
  const backupDir = config.paths.backups;
  const files = await fs.readdir(backupDir);
  const nowMs = Date.now();
  const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (!file.endsWith(".tar.gz") || file === LATEST_LINK) continue;

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
