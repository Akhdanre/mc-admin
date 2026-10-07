import { NextResponse } from "next/server";
import { getAppSettings } from "@/server/services/appSettings";

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json({
    host: settings.rconHost,
    port: settings.rconPort,
    mapUrl: settings.mapUrl,
  });
}
