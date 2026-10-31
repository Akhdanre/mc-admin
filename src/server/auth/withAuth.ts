import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./service";
import { handleRoute, UnauthorizedError } from "@/server/core";

type RouteHandler<TContext = unknown> = (
  req: NextRequest,
  context?: TContext
) => Promise<Response | NextResponse> | Response | NextResponse;

export function withAuth<TContext = unknown>(handler: RouteHandler<TContext>): RouteHandler<TContext> {
  return handleRoute(async (req: NextRequest, context?: TContext) => {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!verifySessionToken(token)) {
      throw new UnauthorizedError();
    }
    return await handler(req, context);
  });
}
