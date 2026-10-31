import { NextRequest, NextResponse } from "next/server";
import { testDiscordWebhook } from "@/server/discord";
import { withAuth } from "@/server/auth";
import type { TestDiscordWebhookResponse } from "@/types";

export const POST = withAuth(async (req: NextRequest) => {
  const body = (await req.json()) as { webhookUrl?: string };
  const res = await testDiscordWebhook(body.webhookUrl);
  return NextResponse.json<TestDiscordWebhookResponse>(res, {
    status: res.success ? 200 : 400,
  });
});
