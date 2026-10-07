import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, saveAppSettings } from "@/server/services/appSettings";
import type { AppSettingsResponse, AppSettings } from "@/types";

export async function GET() {
  const settings = await getAppSettings();
  return NextResponse.json<AppSettingsResponse>({ settings });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AppSettings>;
    const updated = await saveAppSettings(body);
    return NextResponse.json<AppSettingsResponse>({ settings: updated });
  } catch (err: unknown) {
    return NextResponse.json<AppSettingsResponse>(
      {
        settings: await getAppSettings(),
        error: err instanceof Error ? err.message : "Failed to save settings",
      },
      { status: 500 }
    );
  }
}
