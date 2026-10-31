import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, saveAppSettings } from "@/server/settings";
import { withAuth } from "@/server/core";
import { appSettingsPatchSchema } from "@/schemas";
import type { AppSettingsResponse } from "@/types";

export const GET = withAuth(async () => {
  const settings = await getAppSettings();
  return NextResponse.json<AppSettingsResponse>({ settings });
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = appSettingsPatchSchema.parse(await req.json());
  const updated = await saveAppSettings(body);
  return NextResponse.json<AppSettingsResponse>({ settings: updated });
});
