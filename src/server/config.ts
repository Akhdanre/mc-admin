import "server-only";
export const config = {
  rcon: {
    host: process.env.RCON_HOST || "192.168.137.194",
    port: Number(process.env.RCON_PORT) || 25575,
    password: process.env.RCON_PASSWORD || "",
    timeoutMs: Number(process.env.RCON_TIMEOUT_MS) || 5000,
  },
  scripts: {
    // When deployed in container, scripts can run locally (e.g. via shared volume) or via docker exec
    backupManager: process.env.BACKUP_SCRIPT_PATH || "/scripts/backup_manager.py",
    playerTracker: process.env.TRACKER_SCRIPT_PATH || "/scripts/player_tracker.py",
  },
};
