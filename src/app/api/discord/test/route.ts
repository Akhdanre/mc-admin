import { NextRequest, NextResponse } from "next/server";
import { testDiscordWebhook } from "@/server/services/discord";
import type { TestDiscordWebhookResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { webhookUrl?: string };
    const res = await testDiscordWebhook(body.webhookUrl);
    return NextResponse.json<TestDiscordWebhookResponse>(res, {
      status: res.success ? 200 : 400,
    });
  } catch (err: unknown) {
    return NextResponse.json<TestDiscordWebhookResponse>(
      { success: false, error: err instanceof Error ? err.message : "Failed testing webhook" },
      { status: 500 }
    );
  }
}
