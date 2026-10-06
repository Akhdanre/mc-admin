import { NextResponse } from "next/server";
import { getPlayerStatus } from "@/server/services/rcon";
import { getPlayerLocation } from "@/server/services/location";

export async function GET() {
  try {
    const status = await getPlayerStatus();
    const locations = await Promise.all(
      status.players.map(async (name) => {
        const loc = await getPlayerLocation(name);
        return loc;
      })
    );

    const validLocations = locations.filter(Boolean);
    return NextResponse.json({ locations: validLocations });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
