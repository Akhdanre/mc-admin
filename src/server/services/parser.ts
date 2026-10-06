import "server-only";
import type { PlayerStatus } from "@/types";

export function parsePlayerList(raw: string): Omit<PlayerStatus, "updatedAt"> {
  const match = raw.match(/There are (\d+) of a max of (\d+) players online:(.*)/i);
  if (!match) {
    return {
      onlineCount: 0,
      maxCount: 20,
      players: [],
      raw,
    };
  }

  const onlineCount = Number(match[1]);
  const maxCount = Number(match[2]);
  const playerNames = (match[3] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    onlineCount,
    maxCount,
    players: playerNames,
    raw,
  };
}

export function parseWhitelist(raw: string): string[] {
  const match = raw.match(/whitelisted(?:\s+player\(?s?\)?)?:\s*(.*)/i);
  if (!match || !match[1]) {
    return [];
  }

  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
