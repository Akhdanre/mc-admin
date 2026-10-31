import "server-only";
import { executeRconCommand } from "@/server/rcon";
import { buildPlayerLocation, isValidUsername } from "@/server/domain/parse/location";
import type { PlayerLocation } from "@/types";

export async function getPlayerLocation(username: string): Promise<PlayerLocation | null> {
  try {
    const cleanUser = username.trim();
    if (!isValidUsername(cleanUser)) return null;

    // 1. Query coordinates: [0.0d, 64.0d, 0.0d]
    const posRaw = await executeRconCommand(`data get entity ${cleanUser} Pos`);

    // 2. Query dimension: "minecraft:overworld"
    const dimRaw = await executeRconCommand(`data get entity ${cleanUser} Dimension`);

    return buildPlayerLocation(cleanUser, posRaw, dimRaw);
  } catch (err: unknown) {
    console.error(`Failed to get location for ${username}:`, err);
    return null;
  }
}
