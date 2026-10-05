import { NextResponse } from "next/server";
import { executeRconCommand } from "@/services/rcon";
import type { TeleportRequestBody } from "@/types";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,16}$/;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as TeleportRequestBody;
    const player = body.player?.trim();

    if (!player || !USERNAME_REGEX.test(player)) {
      return NextResponse.json({ error: "Valid player name required" }, { status: 400 });
    }

    let command: string;
    if (body.target) {
      const target = body.target.trim();
      if (!USERNAME_REGEX.test(target)) {
        return NextResponse.json({ error: "Valid target player required" }, { status: 400 });
      }
      command = `tp ${player} ${target}`;
    } else if (body.x !== undefined && body.y !== undefined && body.z !== undefined) {
      command = `tp ${player} ${body.x} ${body.y} ${body.z}`;
    } else {
      // Default: teleport to spawn
      command = `tp ${player} 0 ~ 0`;
    }

    const result = await executeRconCommand(command);
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
