import { NextResponse } from "next/server";
import { getAppSettings } from "@/server/settings";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const settings = await getAppSettings();
  return NextResponse.json({
    host: process.env.RCON_HOST || settings.rconHost,
    port: Number(process.env.RCON_PORT) || settings.rconPort,
    mapUrl: process.env.NEXT_PUBLIC_MAP_URL || settings.mapUrl,
    version: "Forge 1.20.1",
  });
});
