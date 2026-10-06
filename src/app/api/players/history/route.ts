import { NextResponse } from "next/server";
import { getPlayerHistory } from "@/server/services/tracker";
import { getPlayerStatus } from "@/server/services/rcon";

export async function GET() {
  try {
    const status = await getPlayerStatus();
    const history = await getPlayerHistory(status.players);
    return NextResponse.json(history);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        players: [],
        lastLoginPlayer: null,
        error: message,
        updatedAt: new Date().toLocaleTimeString(),
      },
      { status: 500 }
    );
  }
}
