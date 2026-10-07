import "server-only";
import fs from "fs/promises";
import path from "path";
import { config } from "@/server/config";
import type { AppSettings } from "@/types";

const SETTINGS_FILE = "app_settings.json";

const DEFAULT_SETTINGS: AppSettings = {
  rconHost: process.env.RCON_HOST || "mc-server",
  rconPort: Number(process.env.RCON_PORT) || 25575,
  rconPassword: process.env.RCON_PASSWORD || "",
  rconTimeoutMs: Number(process.env.RCON_TIMEOUT_MS) || 5000,
  mapUrl: process.env.NEXT_PUBLIC_MAP_URL || "http://localhost:8123",
};

let cachedSettings: AppSettings | null = null;

function getSettingsPath(): string {
  return path.join(config.paths.data, SETTINGS_FILE);
}

export async function getAppSettings(): Promise<AppSettings> {
  if (cachedSettings) return cachedSettings;

  try {
    const raw = await fs.readFile(getSettingsPath(), "utf-8");
    const parsed = JSON.parse(raw);
    cachedSettings = {
      rconHost: typeof parsed.rconHost === "string" ? parsed.rconHost : DEFAULT_SETTINGS.rconHost,
      rconPort: Number(parsed.rconPort) || DEFAULT_SETTINGS.rconPort,
      rconPassword: typeof parsed.rconPassword === "string" ? parsed.rconPassword : DEFAULT_SETTINGS.rconPassword,
      rconTimeoutMs: Number(parsed.rconTimeoutMs) || DEFAULT_SETTINGS.rconTimeoutMs,
      mapUrl: typeof parsed.mapUrl === "string" ? parsed.mapUrl : DEFAULT_SETTINGS.mapUrl,
    };
    return cachedSettings;
  } catch {
    cachedSettings = { ...DEFAULT_SETTINGS };
    return cachedSettings;
  }
}

export async function saveAppSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getAppSettings();
  const updated: AppSettings = {
    rconHost: patch.rconHost !== undefined ? patch.rconHost.trim() : current.rconHost,
    rconPort: patch.rconPort !== undefined ? Number(patch.rconPort) : current.rconPort,
    rconPassword: patch.rconPassword !== undefined ? patch.rconPassword : current.rconPassword,
    rconTimeoutMs: patch.rconTimeoutMs !== undefined ? Number(patch.rconTimeoutMs) : current.rconTimeoutMs,
    mapUrl: patch.mapUrl !== undefined ? patch.mapUrl.trim() : current.mapUrl,
  };

  await fs.mkdir(config.paths.data, { recursive: true });
  await fs.writeFile(getSettingsPath(), JSON.stringify(updated, null, 2), "utf-8");
  cachedSettings = updated;
  return updated;
}
