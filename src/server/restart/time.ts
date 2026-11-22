export const DEFAULT_RESTART_CONFIG = {
  enabled: true,
  hour: 4,
  minute: 0,
  warningSeconds: 60,
  timezone: "UTC",
};

/**
 * Calculates milliseconds from `now` until the next daily target time (UTC).
 * If target time has already passed today, rolls over to tomorrow.
 */
export function getMsUntilDailyTarget(
  targetHour: number,
  targetMinute = 0,
  now: Date = new Date()
): number {
  const next = new Date(now);
  next.setUTCHours(targetHour, targetMinute, 0, 0);

  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }

  return next.getTime() - now.getTime();
}

/**
 * Formats seconds into human readable duration, e.g. "19h 36m" or "45m 12s".
 */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "now";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
