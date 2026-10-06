import { NextRequest, NextResponse } from "next/server";
import { getRecentChatMessages, sendChatMessage } from "@/server/services/chat";
import type { SendChatRequestBody, ChatResponse } from "@/types";

export async function GET() {
  const data = await getRecentChatMessages();
  return NextResponse.json<ChatResponse>(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendChatRequestBody;
    if (!body?.message) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
    }

    const result = await sendChatMessage(body.message);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
