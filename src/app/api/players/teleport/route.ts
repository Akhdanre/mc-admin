import { NextRequest, NextResponse } from "next/server";
import { executeRconCommand } from "@/server/rcon";
import { withAuth } from "@/server/auth";
import { teleportSchema } from "@/schemas";

export const POST = withAuth(async (req: NextRequest) => {
  const body = teleportSchema.parse(await req.json());
  const player = body.player;

  let command: string;
  if (body.targetPlayer) {
    command = `tp ${player} ${body.targetPlayer}`;
  } else if (body.x !== undefined && body.y !== undefined && body.z !== undefined) {
    command = `tp ${player} ${body.x} ${body.y} ${body.z}`;
  } else {
    // Default: teleport to spawn
    command = `tp ${player} 0 ~ 0`;
  }

  const result = await executeRconCommand(command);
  return NextResponse.json({ result });
});
