import { NextRequest, NextResponse } from "next/server";
import { getRecentChatMessages, sendChatMessage } from "@/server/chat";
import { withAuth, BadRequestError } from "@/server/core";
import { sendChatSchema } from "@/schemas";
import type { ChatResponse } from "@/types";

export const GET = withAuth(async () => {
  const data = await getRecentChatMessages();
  return NextResponse.json<ChatResponse>(data);
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = sendChatSchema.parse(await req.json());
  const result = await sendChatMessage(body.message);

  if (!result.success) {
    throw new BadRequestError(result.error || "Failed to broadcast chat message");
  }

  return NextResponse.json({ success: true });
});
