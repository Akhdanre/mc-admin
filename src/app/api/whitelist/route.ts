import { NextRequest, NextResponse } from "next/server";
import { executeRconCommand, getWhitelistStatus } from "@/server/rcon";
import { withAuth } from "@/server/auth";
import { BadRequestError } from "@/server/core";
import { whitelistActionSchema } from "@/schemas";

export const GET = withAuth(async () => {
  const status = await getWhitelistStatus();
  return NextResponse.json(status);
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = whitelistActionSchema.parse(await req.json());
  const action = body.action;

  let command = `whitelist ${action}`;
  if (action === "add" || action === "remove") {
    if (!body.username) {
      throw new BadRequestError("Username is required for add/remove actions");
    }
    command = `whitelist ${action} ${body.username}`;
  }

  const result = await executeRconCommand(command);
  const status = await getWhitelistStatus();
  return NextResponse.json({ result, status });
});
