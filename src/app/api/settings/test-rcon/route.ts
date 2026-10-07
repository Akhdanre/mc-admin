import { NextRequest, NextResponse } from "next/server";
import { Rcon } from "rcon-client";
import { getAppSettings } from "@/server/services/appSettings";
import type { TestRconResponse, AppSettings } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AppSettings>;
    const current = await getAppSettings();

    const host = body.rconHost || current.rconHost;
    const port = Number(body.rconPort) || current.rconPort;
    const password = body.rconPassword !== undefined ? body.rconPassword : current.rconPassword;
    const timeout = Number(body.rconTimeoutMs) || current.rconTimeoutMs;

    const rcon = await Rcon.connect({
      host,
      port,
      password,
      timeout,
    });

    try {
      const resp = await rcon.send("list");
      return NextResponse.json<TestRconResponse>({
        success: true,
        message: `Connected successfully! RCON response: ${resp}`,
      });
    } finally {
      await rcon.end();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to connect to RCON";
    return NextResponse.json<TestRconResponse>(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
