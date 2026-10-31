import "server-only";
import fs from "fs/promises";
import path from "path";
import { config } from "@/server/core";
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
      rconPassword:
        typeof parsed.rconPassword === "string"
          ? parsed.rconPassword
          : DEFAULT_SETTINGS.rconPassword,
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
    rconTimeoutMs:
      patch.rconTimeoutMs !== undefined ? Number(patch.rconTimeoutMs) : current.rconTimeoutMs,
    mapUrl: patch.mapUrl !== undefined ? patch.mapUrl.trim() : current.mapUrl,
  };
  try {
    await fs.mkdir(config.paths.data, { recursive: true });
    await fs.writeFile(getSettingsPath(), JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    // If data directory cannot be written (e.g. read-only CI test environment), keep in-memory
    console.warn("[AppSettings] Could not persist settings to disk:", err);
  }
  cachedSettings = updated;
  return updated;
}
let cachedProperties: Record<string, string> | null = null;

export async function getServerProperties(): Promise<Record<string, string>> {
  const filePath = path.join(config.paths.data, "server.properties");
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const result: Record<string, string> = {};
    const lines = raw.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        result[key] = value;
      }
    }
    cachedProperties = { ...result, ...(cachedProperties || {}) };
    return cachedProperties;
  } catch {
    if (cachedProperties) return cachedProperties;
    cachedProperties = {
      "server-port": "25565",
      motd: "A Minecraft Server",
      difficulty: "normal",
      gamemode: "survival",
      "max-players": "20",
      "view-distance": "6",
      "simulation-distance": "5",
      pvp: "true",
      "white-list": "true",
    };
    return cachedProperties;
  }
}

export async function saveServerProperties(
  patch: Record<string, string>
): Promise<Record<string, string>> {
  const current = await getServerProperties();
  cachedProperties = { ...current, ...patch };

  const filePath = path.join(config.paths.data, "server.properties");
  let lines: string[] = [];
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    lines = raw.split("\n");
  } catch {
    lines = ["#Minecraft server properties"];
  }

  const updatedKeys = new Set<string>();

  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      if (key in patch) {
        updatedKeys.add(key);
        return `${key}=${patch[key]}`;
      }
    }
    return line;
  });

  // Append any keys from patch that were not found in original file
  for (const [k, v] of Object.entries(patch)) {
    if (!updatedKeys.has(k)) {
      newLines.push(`${k}=${v}`);
    }
  }

  try {
    await fs.mkdir(config.paths.data, { recursive: true });
    await fs.writeFile(filePath, newLines.join("\n"), "utf-8");
  } catch (err) {
    console.warn("[ServerProperties] Could not write server.properties:", err);
  }

  return cachedProperties;
}
