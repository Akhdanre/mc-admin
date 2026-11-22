export const LATEST_LINK = "latest.tar.gz";
export const BACKUP_CONFIG_FILE = "backup_config.json";
export const DEFAULT_RETENTION_DAYS = 7;

/**
 * Milliseconds from now until the next occurrence of `targetHour` (server
 * local time), guarding against DST/roll-over by clamping to the next day.
 */
export function getMsUntilTargetHour(targetHour = 5, now: Date = new Date()): number {
  const next = new Date(now);
  next.setHours(targetHour, 0, 0, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 ** 3) {
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  }
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

/**
 * Generates a filesystem-safe archive name like `world-backup-20261011-053000.tar.gz`.
 */
export function buildArchiveName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const timestamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `world-backup-${timestamp}.tar.gz`;
}

export function isBackupArchive(fileName: string): boolean {
  return fileName.endsWith(".tar.gz") && fileName !== LATEST_LINK;
}

/** Rejects filenames that attempt path traversal. */
export function isSafeFilename(fileName: string): boolean {
  return Boolean(fileName) && !fileName.includes("/") && !fileName.includes("\\");
}
/**
 * Parses the UTC date encoded in a backup filename.
 * e.g. "world-backup-20261021-050001.tar.gz" → Date(2026-10-21T05:00:01Z)
 * Returns null if filename does not match expected pattern.
 */
export function parseDateFromFilename(fileName: string): Date | null {
  const match = fileName.match(
    /world-backup-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})\.tar\.gz$/
  );
  if (!match) return null;
  return new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);
}
