import { NextResponse } from "next/server";
import { getPlayerStatus } from "@/server/rcon";
import { getPlayerLocation } from "@/server/players";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const status = await getPlayerStatus();
  const locations = await Promise.all(
    status.players.map(async (name) => {
      const loc = await getPlayerLocation(name);
      return loc;
    })
  );

  const validLocations = locations.filter(Boolean);
  return NextResponse.json({ locations: validLocations });
});
