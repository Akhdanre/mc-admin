import "server-only";
import { Rcon } from "rcon-client";
import { getAppSettings } from "@/server/settings";
import { parseDifficulty, parsePerformance, parsePlayerList, parseWhitelist } from "./parse";
import type { PlayerStatus, WhitelistStatus } from "@/types";

export async function executeRconCommand(command: string): Promise<string> {
  const settings = await getAppSettings();
  const host = process.env.RCON_HOST || settings.rconHost;
  const port = process.env.RCON_PORT ? Number(process.env.RCON_PORT) : settings.rconPort;
  const password = process.env.RCON_PASSWORD || settings.rconPassword;
  const timeout = process.env.RCON_TIMEOUT_MS
    ? Number(process.env.RCON_TIMEOUT_MS)
    : settings.rconTimeoutMs;
  const rcon = await Rcon.connect({
    host,
    port,
    password,
    timeout,
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
    const [listRaw, diffRaw, perfRaw] = await Promise.all([
      executeRconCommand("list"),
      executeRconCommand("difficulty").catch(() => ""),
      executeRconCommand("forge tps").catch(() => executeRconCommand("tps").catch(() => "")),
    ]);
    const parsed = parsePlayerList(listRaw);
    const difficulty = parseDifficulty(diffRaw) ?? undefined;
    const perf = parsePerformance(perfRaw);
    return {
      onlineCount: parsed.onlineCount,
      maxCount: parsed.maxCount,
      players: parsed.players,
      difficulty,
      tps: perf.tps,
      mspt: perf.mspt,
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
