import { NextResponse } from "next/server";
import { config } from "@/server/config";

export async function GET() {
  return NextResponse.json({
    host: config.rcon.host,
    port: config.rcon.port,
  });
}
