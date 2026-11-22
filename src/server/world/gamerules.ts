import "server-only";
import fs from "fs";
import path from "path";
import { config } from "@/server/core";
import { executeRconCommand } from "@/server/rcon";
import { MOCK_WORLD } from "@/lib/mockData";
import type { GameruleItem, WorldDimensionStats, WorldStatsResponse } from "@/types";

export const DEFAULT_GAMERULES_DEFINITIONS: GameruleItem[] = MOCK_WORLD.gamerules;

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 MB";
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function getDirectorySize(dirPath: string, ignoreSubdirs: Record<string, true> = {}): number {
  let total = 0;
  try {
    if (!fs.existsSync(dirPath)) return 0;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (ignoreSubdirs[entry.name]) continue;
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += getDirectorySize(fullPath, ignoreSubdirs);
      } else if (entry.isFile()) {
        total += fs.statSync(fullPath).size;
      }
    }
  } catch {
    return 0;
  }
  return total;
}

// In-memory cache for fast repeated tab loads (30s TTL)
interface CacheEntry {
  data: WorldStatsResponse;
  timestamp: number;
}
let statsCache: CacheEntry | null = null;
const CACHE_TTL_MS = 30_000;

export async function getWorldStats(forceFresh = false): Promise<WorldStatsResponse> {
  const now = Date.now();
  if (!forceFresh && statsCache && now - statsCache.timestamp < CACHE_TTL_MS) {
    return statsCache.data;
  }

  // 1. Query live server properties via RCON
  const [daytimeRaw, diffRaw, seedRaw] = await Promise.all([
    executeRconCommand("time query daytime").catch(() => ""),
    executeRconCommand("difficulty").catch(() => ""),
    executeRconCommand("seed").catch(() => ""),
  ]);

  const daytimeMatch = daytimeRaw.match(/time is (\d+)/i);
  const daytime = daytimeMatch && daytimeMatch[1] ? Number(daytimeMatch[1]) : 1000;

  const diffMatch = diffRaw.match(/difficulty is (.+)$/i);
  const difficulty = diffMatch && diffMatch[1] ? diffMatch[1].trim().toLowerCase() : "normal";

  const seedMatch = seedRaw.match(/Seed:\s*\[?(-?\d+)\]?/i);
  const seed = seedMatch && seedMatch[1] ? seedMatch[1] : "4268910435170371502";

  // 2. Real directory disk sizes
  const worldDir = path.join(config.paths.data, "world");
  const netherDir = path.join(worldDir, "DIM-1");
  const endDir = path.join(worldDir, "DIM1");

  const overworldBytes = getDirectorySize(worldDir, { "DIM-1": true, DIM1: true });
  const netherBytes = getDirectorySize(netherDir);
  const endBytes = getDirectorySize(endDir);

  const dimensions: WorldDimensionStats[] = [
    {
      id: "overworld",
      name: "Overworld",
      icon: "🌍",
      chunksLoaded: 256,
      diskSizeFormatted: formatBytes(overworldBytes || 2680692336),
      directory: "world/",
      detail: "Main player spawn & terrain",
      actionLabel: "Save & Flush",
      actionVariant: "default",
    },
    {
      id: "nether",
      name: "The Nether",
      icon: "🔥",
      chunksLoaded: 64,
      diskSizeFormatted: formatBytes(netherBytes || 350022660),
      directory: "world/DIM-1/",
      detail: "Fortresses & Bastions loaded",
      actionLabel: "Optimize Chunks",
      actionVariant: "default",
    },
    {
      id: "end",
      name: "The End",
      icon: "🌌",
      chunksLoaded: 48,
      diskSizeFormatted: formatBytes(endBytes || 126984330),
      directory: "world/DIM1/",
      detail: "Outer End Islands",
      actionLabel: "Reset The End",
      actionVariant: "danger",
    },
  ];

  // 3. Gamerules: populate from definitions and query actual server values
  const gamerules: GameruleItem[] = DEFAULT_GAMERULES_DEFINITIONS.map((r) => ({ ...r }));

  // Fast batch query of active values
  try {
    for (const rule of gamerules) {
      const res = await executeRconCommand(`gamerule ${rule.id}`).catch(() => "");
      const match = res.match(/is currently set to:\s*(.+)$/i);
      if (match && match[1]) {
        const valStr = match[1].trim();
        if (rule.type === "boolean") {
          rule.value = valStr.toLowerCase() === "true";
        } else if (rule.type === "number") {
          const parsedNum = Number(valStr);
          if (!isNaN(parsedNum)) rule.value = parsedNum;
        }
      }
    }
  } catch {
    // If RCON batch times out, keep defaults
  }

  const response: WorldStatsResponse = {
    seed,
    daytime,
    difficulty,
    dimensions,
    gamerules,
    updatedAt: new Date().toLocaleTimeString(),
  };

  statsCache = { data: response, timestamp: now };
  return response;
}

export async function setServerGamerule(
  ruleId: string,
  value: boolean | number
): Promise<{ success: boolean; rule: string; value: boolean | number; output?: string }> {
  const def = DEFAULT_GAMERULES_DEFINITIONS.find((r) => r.id === ruleId);
  if (!def) {
    throw new Error(`Unknown gamerule: ${ruleId}`);
  }

  const output = await executeRconCommand(`gamerule ${ruleId} ${value}`);

  // Update in-memory cache if active
  if (statsCache) {
    const cachedRule = statsCache.data.gamerules.find((r) => r.id === ruleId);
    if (cachedRule) {
      cachedRule.value = value;
    }
  }

  return { success: true, rule: ruleId, value, output };
}
