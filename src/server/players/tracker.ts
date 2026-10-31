import "server-only";
import fs from "fs/promises";
import path from "path";
import readline from "readline";
import { createReadStream } from "fs";
import { config } from "@/server/config";
import type { PlayerHistory, PlayerHistoryResponse } from "@/types";

interface UserCacheEntry {
  name: string;
  uuid: string;
  expiresOn?: string;
}

export async function getPlayerHistory(onlinePlayerNames: string[] = []): Promise<PlayerHistoryResponse> {
  const updatedAt = new Date().toLocaleTimeString();

  try {
    const dataDir = config.paths.data;
    const usercacheFile = path.join(dataDir, "usercache.json");
    const playerdataDir = path.join(dataDir, "world", "playerdata");
    const latestLogFile = path.join(dataDir, "logs", "latest.log");

    // 1. Load usercache.json
    const usercache = new Map<string, string>();
    try {
      const rawCache = await fs.readFile(usercacheFile, "utf-8");
      const parsed: UserCacheEntry[] = JSON.parse(rawCache);
      for (const entry of parsed) {
        if (entry.uuid && entry.name) {
          usercache.set(entry.uuid, entry.name);
        }
      }
    } catch {
      // Missing or unreadable cache is allowed
    }

    const playerMap = new Map<string, PlayerHistory>();

    // 2. Scan world/playerdata/*.dat files for lastSeen timestamps
    try {
      const files = await fs.readdir(playerdataDir);
      for (const file of files) {
        if (!file.endsWith(".dat")) continue;
        const uuid = file.slice(0, -4);
        const name = usercache.get(uuid) || uuid;
        const stat = await fs.stat(path.join(playerdataDir, file));
        const mtimeMs = Math.floor(stat.mtimeMs);

        playerMap.set(name.toLowerCase(), {
          username: name,
          uuid,
          lastSeen: new Date(mtimeMs).toISOString(),
          lastSeenTimestamp: mtimeMs,
          lastLogin: null,
          lastLoginTimestamp: null,
          online: false,
        });
      }
    } catch {
      // playerdata dir might not exist yet
    }

    // 3. Scan logs/latest.log for recent player joins
    try {
      const stream = createReadStream(latestLogFile, { encoding: "utf-8" });
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

      // Pattern: [06Oct2026 16:00:38.436] [...]]: PlayerName joined the game
      const joinRegex = /\[(\d{2}[A-Za-z]{3}\d{4} \d{2}:\d{2}:\d{2}\.\d{3})\].*?\]:\s+(\w+)\s+joined the game/;

      for await (const line of rl) {
        const match = line.match(joinRegex);
        if (!match) continue;

        const [, timestr, username] = match;
        const parsedDate = parseMinecraftLogTime(timestr);
        if (!parsedDate) continue;

        const ts = parsedDate.getTime();
        const key = username.toLowerCase();
        const existing = playerMap.get(key);

        if (existing) {
          if (!existing.lastLoginTimestamp || ts > existing.lastLoginTimestamp) {
            existing.lastLogin = parsedDate.toISOString();
            existing.lastLoginTimestamp = ts;
          }
        } else {
          playerMap.set(key, {
            username,
            uuid: null,
            lastSeen: null,
            lastSeenTimestamp: null,
            lastLogin: parsedDate.toISOString(),
            lastLoginTimestamp: ts,
            online: false,
          });
        }
      }
    } catch {
      // logs file unreadable or not created yet
    }

    // 4. Mark online players
    const onlineSet = new Set(onlinePlayerNames.map((n) => n.toLowerCase()));
    const players: PlayerHistory[] = Array.from(playerMap.values()).map((p) => ({
      ...p,
      online: onlineSet.has(p.username.toLowerCase()),
    }));

    // Sort by newest activity
    players.sort(
      (a, b) =>
        (b.lastLoginTimestamp ?? b.lastSeenTimestamp ?? 0) -
        (a.lastLoginTimestamp ?? a.lastSeenTimestamp ?? 0)
    );

    const lastLoginPlayer = players[0] || null;

    return {
      players,
      lastLoginPlayer,
      updatedAt,
    };
  } catch (err: unknown) {
    return {
      players: [],
      lastLoginPlayer: null,
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}

// Parses "06Oct2026 16:00:38.436" into Date
function parseMinecraftLogTime(str: string): Date | null {
  const match = str.match(/^(\d{2})([A-Za-z]{3})(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) return null;

  const [, day, monthStr, year, hour, min, sec, ms] = match;
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const month = months[monthStr] || "01";
  const iso = `${year}-${month}-${day}T${hour}:${min}:${sec}.${ms}Z`;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
}
