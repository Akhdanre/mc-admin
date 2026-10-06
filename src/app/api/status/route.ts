import { NextResponse } from "next/server";
import { getPlayerStatus } from "@/server/services/rcon";

export async function GET() {
  const status = await getPlayerStatus();
  return NextResponse.json(status);
}
