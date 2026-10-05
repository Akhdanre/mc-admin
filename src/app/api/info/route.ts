import { NextResponse } from "next/server";
import { config } from "@/config";

export async function GET() {
  return NextResponse.json({
    host: config.rcon.host,
    port: config.rcon.port,
  });
}
