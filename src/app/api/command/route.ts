import { NextResponse } from "next/server";
import { executeRconCommand } from "@/server/services/rcon";
import type { CommandRequestBody } from "@/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CommandRequestBody;
    if (!body.command) {
      return NextResponse.json({ error: "Command required" }, { status: 400 });
    }
    const result = await executeRconCommand(body.command);
    return NextResponse.json({ result });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
