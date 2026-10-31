import { NextRequest } from "next/server";
import { subscribeToLogStream } from "@/server/chat";
import { withAuth } from "@/server/auth";
import type { ConsoleLogItem } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withAuth(async (req: NextRequest) => {
  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`: connected\n\n`));

      unsubscribe = subscribeToLogStream((log: ConsoleLogItem) => {
        try {
          const payload = `data: ${JSON.stringify(log)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream closed
        }
      });

      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          clearInterval(keepAliveTimer ?? undefined);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      clearInterval(keepAliveTimer ?? undefined);
    },
  });

  req.signal.addEventListener("abort", () => {
    if (unsubscribe) unsubscribe();
    clearInterval(keepAliveTimer ?? undefined);
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
});
