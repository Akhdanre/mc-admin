import { NextResponse } from "next/server";
import { executeRconCommand, getWhitelistStatus } from "@/services/rcon";
import type { WhitelistAction, WhitelistRequestBody } from "@/types";

const ALLOWED_WHITELIST_ACTIONS: Record<WhitelistAction, true> = {
  add: true,
  remove: true,
  reload: true,
  on: true,
  off: true,
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,16}$/;

export async function GET() {
  const status = await getWhitelistStatus();
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WhitelistRequestBody;
    const action = body.action;

    if (!action || !ALLOWED_WHITELIST_ACTIONS[action]) {
      return NextResponse.json(
        { error: "Invalid action. Supported: add, remove, reload, on, off" },
        { status: 400 }
      );
    }

    let command = `whitelist ${action}`;
    if (action === "add" || action === "remove") {
      const cleanUser = body.username?.trim() ?? "";
      if (!USERNAME_REGEX.test(cleanUser)) {
        return NextResponse.json(
          {
            error:
              "Invalid username. Minecraft usernames must be 1-16 alphanumeric characters or underscores.",
          },
          { status: 400 }
        );
      }
      command = `whitelist ${action} ${cleanUser}`;
    }

    const result = await executeRconCommand(command);
    const status = await getWhitelistStatus();
    return NextResponse.json({ result, status });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
