import { NextRequest, NextResponse } from "next/server";
import { executeRconCommand } from "@/server/rcon";
import { withAuth } from "@/server/auth";
import { checkRateLimit } from "@/server/core";
import { commandSchema } from "@/schemas";

export const POST = withAuth(async (req: NextRequest) => {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  checkRateLimit(`command:${clientIp}`, 60, 60_000);

  const body = commandSchema.parse(await req.json());
  const result = await executeRconCommand(body.command);
  return NextResponse.json({ result });
});
