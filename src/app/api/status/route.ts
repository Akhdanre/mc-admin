import { NextResponse } from "next/server";
import { getPlayerStatus } from "@/server/rcon";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const status = await getPlayerStatus();
  return NextResponse.json(status);
});
