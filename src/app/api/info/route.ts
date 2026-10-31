import { NextResponse } from "next/server";
import { getAppSettings } from "@/server/settings";
import { withAuth } from "@/server/core";

export const GET = withAuth(async () => {
  const settings = await getAppSettings();
  return NextResponse.json({
    host: settings.rconHost,
    port: settings.rconPort,
    mapUrl: settings.mapUrl,
  });
});
