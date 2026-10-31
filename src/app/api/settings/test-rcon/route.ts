import { NextRequest, NextResponse } from "next/server";
import { Rcon } from "rcon-client";
import { getAppSettings } from "@/server/settings";
import { withAuth } from "@/server/auth";
import { BadRequestError } from "@/server/core";
import type { TestRconResponse, AppSettings } from "@/types";

export const POST = withAuth(async (req: NextRequest) => {
  const body = (await req.json()) as Partial<AppSettings>;
  const current = await getAppSettings();

  const host = body.rconHost || current.rconHost;
  const port = Number(body.rconPort) || current.rconPort;
  const password = body.rconPassword !== undefined ? body.rconPassword : current.rconPassword;
  const timeout = Number(body.rconTimeoutMs) || current.rconTimeoutMs;

  try {
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to connect to RCON server";
    throw new BadRequestError(`RCON connection failed: ${msg}`);
  }
});
