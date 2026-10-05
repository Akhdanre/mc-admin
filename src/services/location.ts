import { executeRconCommand } from "./rcon";
import type { PlayerLocation } from "@/types";

export async function getPlayerLocation(username: string): Promise<PlayerLocation | null> {
  try {
    const cleanUser = username.trim();
    if (!/^[a-zA-Z0-9_]{1,16}$/.test(cleanUser)) return null;

    // 1. Query coordinates: [0.0d, 64.0d, 0.0d]
    const posRaw = await executeRconCommand(`data get entity ${cleanUser} Pos`);
    const posMatch = posRaw.match(/\[\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?\s*\]/);

    // 2. Query dimension: "minecraft:overworld"
    const dimRaw = await executeRconCommand(`data get entity ${cleanUser} Dimension`);
    const dimMatch = dimRaw.match(/has the following entity data:\s*"(?:minecraft:)?([^"]+)"/i) ||
      dimRaw.match(/"(?:minecraft:)?([^"]+)"/);

    if (!posMatch || !posMatch[1] || !posMatch[2] || !posMatch[3]) return null;

    const x = Math.round(parseFloat(posMatch[1]) * 10) / 10;
    const y = Math.round(parseFloat(posMatch[2]) * 10) / 10;
    const z = Math.round(parseFloat(posMatch[3]) * 10) / 10;
    const dimension = dimMatch && dimMatch[1] ? dimMatch[1] : "overworld";

    return {
      username: cleanUser,
      x,
      y,
      z,
      dimension,
    };
  } catch (err: unknown) {
    console.error(`Failed to get location for ${username}:`, err);
    return null;
  }
}
