import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError, BadRequestError, RateLimitError } from "./errors";

type RouteHandler<TContext = unknown> = (
  req: NextRequest,
  context?: TContext
) => Promise<Response | NextResponse> | Response | NextResponse;

// Simple sliding window in-memory rate limiter
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitBuckets = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): void {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || { timestamps: [] };

  // Evict timestamps outside window
  const validTimestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

  if (validTimestamps.length >= maxRequests) {
    throw new RateLimitError();
  }

  validTimestamps.push(now);
  rateLimitBuckets.set(key, { timestamps: validTimestamps });
}

export function checkCsrf(req: NextRequest): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return;
  }

  const origin = req.headers.get("origin");
  const host = req.headers.get("host");

  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        throw new BadRequestError("CSRF check failed: origin does not match host");
      }
    } catch {
      throw new BadRequestError("CSRF check failed: malformed origin");
    }
  }
}

export function handleRoute<TContext = unknown>(handler: RouteHandler<TContext>): RouteHandler<TContext> {
  return async (req: NextRequest, context?: TContext) => {
    try {
      checkCsrf(req);
      return await handler(req, context);
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid request payload",
              details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
            },
          },
          { status: 400 }
        );
      }

      if (err instanceof AppError) {
        return NextResponse.json(
          {
            error: {
              code: err.code,
              message: err.message,
              ...(err.details !== undefined ? { details: err.details } : {}),
            },
          },
          { status: err.statusCode }
        );
      }

      console.error("[Unhandled Route Error]:", err);
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: err instanceof Error ? err.message : "An unexpected error occurred",
          },
        },
        { status: 500 }
      );
    }
  };
}
