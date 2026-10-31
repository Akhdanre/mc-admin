import { NextRequest, NextResponse } from "next/server";
import { getDiscordConfig, saveDiscordConfig } from "@/server/discord";
import { withAuth } from "@/server/core";
import type { DiscordSettingsResponse, DiscordConfig } from "@/types";

export const GET = withAuth(async () => {
  const config = await getDiscordConfig();
  return NextResponse.json<DiscordSettingsResponse>({ config });
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = (await req.json()) as Partial<DiscordConfig>;
  const updated = await saveDiscordConfig(body);
  return NextResponse.json<DiscordSettingsResponse>({ config: updated });
});
