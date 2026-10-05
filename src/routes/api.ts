import { config } from "../config.ts";
import {
  executeRconCommand,
  getPlayerStatus,
  getWhitelistStatus,
} from "../services/rcon.ts";
import type {
  CommandRequestBody,
  WhitelistRequestBody,
  WhitelistAction,
} from "../types.ts";

const ALLOWED_WHITELIST_ACTIONS: Record<WhitelistAction, true> = {
  add: true,
  remove: true,
  reload: true,
  on: true,
  off: true,
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]{1,16}$/;

export async function handleGetStatus(): Promise<Response> {
  const status = await getPlayerStatus();
  return Response.json(status);
}

export function handleGetInfo(): Response {
  return Response.json({
    host: config.rcon.host,
    port: config.rcon.port,
  });
}

export async function handleGetWhitelist(): Promise<Response> {
  const status = await getWhitelistStatus();
  return Response.json(status);
}

export async function handlePostWhitelist(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as WhitelistRequestBody;
    const action = body.action;

    if (!action || !ALLOWED_WHITELIST_ACTIONS[action]) {
      return Response.json(
        { error: "Invalid action. Supported: add, remove, reload, on, off" },
        { status: 400 }
      );
    }

    let command = `whitelist ${action}`;
    if (action === "add" || action === "remove") {
      const cleanUser = body.username?.trim() ?? "";
      if (!USERNAME_REGEX.test(cleanUser)) {
        return Response.json(
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
    return Response.json({ result, status });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}

export async function handlePostCommand(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as CommandRequestBody;
    if (!body.command) {
      return Response.json({ error: "Command required" }, { status: 400 });
    }
    const result = await executeRconCommand(body.command);
    return Response.json({ result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return Response.json({ error: errorMessage }, { status: 500 });
  }
}
