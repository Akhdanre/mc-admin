import "server-only";
import { Rcon } from "rcon-client";
import { config } from "@/server/config";
import { parsePlayerList, parseWhitelist } from "@/server/services/parser";
import type { PlayerStatus, WhitelistStatus } from "@/types";

export async function executeRconCommand(command: string): Promise<string> {
  const rcon = await Rcon.connect({
    host: config.rcon.host,
    port: config.rcon.port,
    password: config.rcon.password,
    timeout: config.rcon.timeoutMs,
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
    const raw = await executeRconCommand("list");
    const parsed = parsePlayerList(raw);
    return {
      onlineCount: parsed.onlineCount,
      maxCount: parsed.maxCount,
      players: parsed.players,
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
