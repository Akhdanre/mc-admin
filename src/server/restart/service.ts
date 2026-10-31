import "server-only";
import fs from "fs/promises";
import path from "path";
import { config } from "@/server/core";
import { executeRconCommand } from "@/server/rcon";
import type { RestartConfig, RestartStatusResponse } from "@/types";
import { DEFAULT_RESTART_CONFIG, getMsUntilDailyTarget } from "./time";

const RESTART_CONFIG_FILE = "restart_config.json";

let cachedRestartConfig: RestartConfig | null = null;

declare global {
  var __mcRestartTimer: NodeJS.Timeout | undefined;
  var __mcRestartCountdownTimer: NodeJS.Timeout | undefined;
}

function getRestartConfigPath(): string {
  return path.join(config.paths.data, RESTART_CONFIG_FILE);
}

export async function getRestartConfig(): Promise<RestartConfig> {
  if (cachedRestartConfig) return cachedRestartConfig;

  try {
    const raw = await fs.readFile(getRestartConfigPath(), "utf-8");
    const parsed = JSON.parse(raw);
    cachedRestartConfig = {
      enabled:
        typeof parsed.enabled === "boolean" ? parsed.enabled : DEFAULT_RESTART_CONFIG.enabled,
      hour:
        Number.isInteger(parsed.hour) && parsed.hour >= 0 && parsed.hour <= 23
          ? parsed.hour
          : DEFAULT_RESTART_CONFIG.hour,
      minute:
        Number.isInteger(parsed.minute) && parsed.minute >= 0 && parsed.minute <= 59
          ? parsed.minute
          : DEFAULT_RESTART_CONFIG.minute,
      warningSeconds: Number(parsed.warningSeconds) || DEFAULT_RESTART_CONFIG.warningSeconds,
      timezone:
        typeof parsed.timezone === "string" ? parsed.timezone : DEFAULT_RESTART_CONFIG.timezone,
    };
    return cachedRestartConfig;
  } catch {
    cachedRestartConfig = { ...DEFAULT_RESTART_CONFIG };
    return cachedRestartConfig;
  }
}

export async function saveRestartConfig(patch: Partial<RestartConfig>): Promise<RestartConfig> {
  const current = await getRestartConfig();
  const updated: RestartConfig = {
    enabled: typeof patch.enabled === "boolean" ? patch.enabled : current.enabled,
    hour:
      Number.isInteger(patch.hour) && patch.hour! >= 0 && patch.hour! <= 23
        ? patch.hour!
        : current.hour,
    minute:
      Number.isInteger(patch.minute) && patch.minute! >= 0 && patch.minute! <= 59
        ? patch.minute!
        : current.minute,
    warningSeconds: Number(patch.warningSeconds) || current.warningSeconds,
    timezone: typeof patch.timezone === "string" ? patch.timezone.trim() : current.timezone,
  };

  try {
    await fs.mkdir(config.paths.data, { recursive: true });
    await fs.writeFile(getRestartConfigPath(), JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("[RestartScheduler] Could not write config to disk:", err);
  }

  cachedRestartConfig = updated;

  // Reschedule timer with new config
  scheduleNextDailyRestart(updated);

  return updated;
}

export async function getRestartStatus(): Promise<RestartStatusResponse> {
  const cfg = await getRestartConfig();

  if (!cfg.enabled) {
    return {
      config: cfg,
      nextRestartIso: null,
      secondsUntilNext: null,
    };
  }

  const msUntil = getMsUntilDailyTarget(cfg.hour, cfg.minute);
  const nextDate = new Date(Date.now() + msUntil);

  return {
    config: cfg,
    nextRestartIso: nextDate.toISOString(),
    secondsUntilNext: Math.round(msUntil / 1000),
  };
}

/**
 * Executes a graceful restart sequence:
 * 1. Broadcasts countdown warnings to players via tellraw
 * 2. Flushes world data to disk via save-all flush
 * 3. Dispatches /stop so container/process supervisor can reboot the server
 */
export async function executeRestartSequence(warningSeconds = 60): Promise<void> {
  console.log(
    `[RestartScheduler] Initiating server restart sequence with ${warningSeconds}s warning...`
  );

  // Clear any existing countdown
  if (globalThis.__mcRestartCountdownTimer) {
    clearTimeout(globalThis.__mcRestartCountdownTimer);
  }

  // 1. Initial warning
  try {
    await executeRconCommand(
      `tellraw @a {"text":"[Server] Scheduled restart in ${warningSeconds} seconds! Please find a safe spot.","color":"gold"}`
    );
  } catch (err) {
    console.warn("[RestartScheduler] Warning broadcast failed:", err);
  }

  // Intermediate warnings (e.g. 10s and 3s)
  if (warningSeconds > 10) {
    setTimeout(
      async () => {
        try {
          await executeRconCommand(
            'tellraw @a {"text":"[Server] Restarting in 10 seconds! Saving chunks...","color":"red"}'
          );
          await executeRconCommand("save-all flush");
        } catch {
          // ignore
        }
      },
      (warningSeconds - 10) * 1000
    );
  }

  // Final stop
  globalThis.__mcRestartCountdownTimer = setTimeout(async () => {
    try {
      console.log("[RestartScheduler] Finalizing restart: saving chunks and sending stop...");
      await executeRconCommand("save-all flush");
      await executeRconCommand(
        'tellraw @a {"text":"[Server] Server is restarting NOW.","color":"dark_red"}'
      );
      await executeRconCommand("stop");
    } catch (err) {
      console.error("[RestartScheduler] Error dispatching /stop command:", err);
    }
  }, warningSeconds * 1000);
}

/**
 * Sets up or resets the Node.js timeout for the next scheduled restart.
 */
function scheduleNextDailyRestart(cfg: RestartConfig): void {
  if (globalThis.__mcRestartTimer) {
    clearTimeout(globalThis.__mcRestartTimer);
    globalThis.__mcRestartTimer = undefined;
  }

  if (!cfg.enabled) {
    console.log("[RestartScheduler] Auto-restart is disabled.");
    return;
  }

  const delayMs = getMsUntilDailyTarget(cfg.hour, cfg.minute);
  const targetTimeStr = `${String(cfg.hour).padStart(2, "0")}:${String(cfg.minute).padStart(2, "0")} UTC`;

  console.log(
    `[RestartScheduler] Scheduled next auto-restart at ${targetTimeStr} (in ${(delayMs / 3600000).toFixed(1)}h)`
  );

  globalThis.__mcRestartTimer = setTimeout(async () => {
    try {
      await executeRestartSequence(cfg.warningSeconds);
    } catch (err) {
      console.error("[RestartScheduler] Error during scheduled restart:", err);
    } finally {
      // Re-schedule for next day
      const latestCfg = await getRestartConfig();
      scheduleNextDailyRestart(latestCfg);
    }
  }, delayMs);
}

/**
 * Initializes the restart scheduler singleton once on server start.
 */
export async function startRestartScheduler(): Promise<void> {
  const cfg = await getRestartConfig();
  scheduleNextDailyRestart(cfg);
}
