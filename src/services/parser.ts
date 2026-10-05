import type { PlayerStatus } from "../types.ts";

export function parsePlayerList(raw: string): Omit<PlayerStatus, "updatedAt"> {
  // Typical output:
  // "There are 0 of a max of 20 players online: "
  // "There are 2 of a max of 20 players online: Alex, Steve"
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
  // Vanilla/Paper typical formats:
  // "There are 2 whitelisted player(s): Steve, Alex"
  // "There are no whitelisted players"
  // "Whitelisted players: Steve, Alex"
  const match = raw.match(/whitelisted(?:\s+player\(?s?\)?)?:\s*(.*)/i);
  if (!match || !match[1]) {
    return [];
  }

  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
