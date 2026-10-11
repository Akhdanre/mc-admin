import type { PlayerLocation } from "@/types";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,16}$/;

export function isValidUsername(username: string): boolean {
  return USERNAME_REGEX.test(username.trim());
}

/** Parses the RCON `data get entity <user> Pos` response: `[0.0d, 64.0d, 0.0d]`. */
export function parsePosition(raw: string): { x: number; y: number; z: number } | null {
  const match = raw.match(/\[\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?,\s*(-?[\d.]+)d?\s*\]/);
  if (!match || !match[1] || !match[2] || !match[3]) return null;

  const round = (value: string) => Math.round(parseFloat(value) * 10) / 10;
  return { x: round(match[1]), y: round(match[2]), z: round(match[3]) };
}

/** Parses the RCON `data get entity <user> Dimension` response. */
export function parseDimension(raw: string): string {
  const match =
    raw.match(/has the following entity data:\s*"(?:minecraft:)?([^"]+)"/i) ||
    raw.match(/"(?:minecraft:)?([^"]+)"/);
  return match && match[1] ? match[1] : "overworld";
}

export function buildPlayerLocation(username: string, posRaw: string, dimRaw: string): PlayerLocation | null {
  const cleanUser = username.trim();
  if (!isValidUsername(cleanUser)) return null;

  const pos = parsePosition(posRaw);
  if (!pos) return null;

  return {
    username: cleanUser,
    x: pos.x,
    y: pos.y,
    z: pos.z,
    dimension: parseDimension(dimRaw),
  };
}
