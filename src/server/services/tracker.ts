import "server-only";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "@/server/config";
import type { PlayerHistory, PlayerHistoryResponse } from "@/types";

const execAsync = promisify(exec);

export async function getPlayerHistory(onlinePlayerNames: string[] = []): Promise<PlayerHistoryResponse> {
  const updatedAt = new Date().toLocaleTimeString();

  try {
    const command = `python3 ${config.scripts.playerTracker}`;

    const { stdout } = await execAsync(command, { timeout: 8000 });
    const rawList: Array<{
      username: string;
      uuid?: string | null;
      lastSeen?: string | null;
      lastSeenTimestamp?: number | null;
      lastLogin?: string | null;
      lastLoginTimestamp?: number | null;
    }> = JSON.parse(stdout.trim());

    const onlineSet = new Set(onlinePlayerNames.map((n) => n.toLowerCase()));

    const players: PlayerHistory[] = rawList.map((p) => {
      const isOnline = onlineSet.has(p.username.toLowerCase());
      return {
        username: p.username,
        uuid: p.uuid ?? null,
        lastSeen: p.lastSeen ?? null,
        lastSeenTimestamp: p.lastSeenTimestamp ?? null,
        lastLogin: p.lastLogin ?? null,
        lastLoginTimestamp: p.lastLoginTimestamp ?? null,
        online: isOnline,
      };
    });

    // Find the player with the most recent login or activity
    const lastLoginPlayer =
      [...players].sort(
        (a, b) =>
          (b.lastLoginTimestamp ?? b.lastSeenTimestamp ?? 0) -
          (a.lastLoginTimestamp ?? a.lastSeenTimestamp ?? 0)
      )[0] || null;

    return {
      players,
      lastLoginPlayer,
      updatedAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      players: [],
      lastLoginPlayer: null,
      error: message,
      updatedAt,
    };
  }
}
