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

export function parseDifficulty(raw: string): string | null {
  const match = raw.match(/difficulty is\s+([a-zA-Z]+)/i);
  return match?.[1] ? match[1].toLowerCase() : null;
}

export function parsePerformance(raw: string): { tps?: number; mspt?: number } {
  if (!raw) return {};

  // Forge: "Overall: Mean tick time: 2.272 ms. Mean TPS: 20.000" or single dimension
  const forgeMatch = raw.match(/Mean tick time:\s*([\d.]+)\s*ms.*?Mean TPS:\s*([\d.]+)/i);
  if (forgeMatch?.[1] && forgeMatch[2]) {
    return {
      mspt: parseFloat(forgeMatch[1]),
      tps: parseFloat(forgeMatch[2]),
    };
  }

  // Paper: "TPS from last 1m, 5m, 15m: 20.0, 20.0, 20.0"
  const paperTpsMatch = raw.match(/TPS from last [^:]*:\s*([\d.]+)/i);
  const paperMsptMatch = raw.match(/Tick durations.*?:\s*([\d.]+)/i);

  const tps = paperTpsMatch?.[1] ? parseFloat(paperTpsMatch[1]) : undefined;
  const mspt = paperMsptMatch?.[1] ? parseFloat(paperMsptMatch[1]) : undefined;

  return { tps, mspt };
}
