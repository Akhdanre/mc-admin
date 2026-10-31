import { NextResponse } from "next/server";
import { getRestartStatus, saveRestartConfig, executeRestartSequence } from "@/server/restart";

export async function GET() {
  try {
    const status = await getRestartStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Action 1: Trigger immediate restart countdown
    if (body.action === "restart_now") {
      const warningSeconds = Number(body.warningSeconds) || 60;
      await executeRestartSequence(warningSeconds);
      return NextResponse.json({
        success: true,
        message: `Restart countdown (${warningSeconds}s) initiated.`,
      });
    }

    // Action 2: Update restart schedule config
    const updated = await saveRestartConfig(body);
    const status = await getRestartStatus();

    return NextResponse.json({
      success: true,
      config: updated,
      nextRestartIso: status.nextRestartIso,
      secondsUntilNext: status.secondsUntilNext,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
