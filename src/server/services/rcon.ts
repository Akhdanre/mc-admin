import "server-only";
import { Rcon } from "rcon-client";
import { getAppSettings } from "@/server/services/appSettings";
import { parseDifficulty, parsePlayerList, parseWhitelist } from "@/server/services/parser";
import type { PlayerStatus, WhitelistStatus } from "@/types";

export async function executeRconCommand(command: string): Promise<string> {
  const settings = await getAppSettings();
  const rcon = await Rcon.connect({
    host: settings.rconHost,
    port: settings.rconPort,
    password: settings.rconPassword,
    timeout: settings.rconTimeoutMs,
  });

  try {
    return await rcon.send(command);
  } finally {
    await rcon.end();
  }
}

export async function getPlayerStatus(): Promise<PlayerStatus> {
  const updatedAt = new Date().toLocaleTimeString();
  try {
    const [listRaw, diffRaw] = await Promise.all([
      executeRconCommand("list"),
      executeRconCommand("difficulty").catch(() => ""),
    ]);
    const parsed = parsePlayerList(listRaw);
    const difficulty = parseDifficulty(diffRaw) ?? undefined;
    return {
      onlineCount: parsed.onlineCount,
      maxCount: parsed.maxCount,
      players: parsed.players,
      difficulty,
      raw: parsed.raw,
      updatedAt,
    };
  } catch (err: unknown) {
    return {
      onlineCount: 0,
      maxCount: 0,
      players: [],
      raw: "",
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}

export async function getWhitelistStatus(): Promise<WhitelistStatus> {
  const updatedAt = new Date().toLocaleTimeString();
  try {
    const raw = await executeRconCommand("whitelist list");
    return {
      players: parseWhitelist(raw),
      raw,
      updatedAt,
    };
  } catch (err: unknown) {
    return {
      players: [],
      raw: "",
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}
