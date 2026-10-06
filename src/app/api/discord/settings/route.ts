import { NextRequest, NextResponse } from "next/server";
import { getDiscordConfig, saveDiscordConfig } from "@/server/services/discord";
import type { DiscordSettingsResponse, DiscordConfig } from "@/types";

export async function GET() {
  const config = await getDiscordConfig();
  return NextResponse.json<DiscordSettingsResponse>({ config });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DiscordConfig>;
    const updated = await saveDiscordConfig(body);
    return NextResponse.json<DiscordSettingsResponse>({ config: updated });
  } catch (err: unknown) {
    return NextResponse.json<DiscordSettingsResponse>(
      {
        config: await getDiscordConfig(),
        error: err instanceof Error ? err.message : "Failed to save Discord settings",
      },
      { status: 500 }
    );
  }
}
