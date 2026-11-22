import { NextResponse } from "next/server";
import { getPlayerHistory } from "@/server/players";
import { getPlayerStatus } from "@/server/rcon";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const status = await getPlayerStatus();
  const history = await getPlayerHistory(status.players);
  return NextResponse.json(history);
});
