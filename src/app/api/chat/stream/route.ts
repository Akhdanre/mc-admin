import { NextRequest } from "next/server";
import { subscribeToChatStream } from "@/server/services/chat";
import type { ChatMessage } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial connection acknowledgment
      controller.enqueue(encoder.encode(`: connected\n\n`));

      // 2. Subscribe to live chat messages
      unsubscribe = subscribeToChatStream((msg: ChatMessage) => {
        try {
          const payload = `data: ${JSON.stringify(msg)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Controller might already be closed
        }
      });

      // 3. Keep-alive ping every 15s to keep proxy connections open
      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(keepAliveTimer!);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      clearInterval(keepAliveTimer!);
    },
  });

  // Handle client abort / disconnect
  req.signal.addEventListener("abort", () => {
    if (unsubscribe) unsubscribe();
    clearInterval(keepAliveTimer!);
  });


  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
