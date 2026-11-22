import { NextResponse } from "next/server";
import { getRecentConsoleLogs } from "@/server/chat";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const data = await getRecentConsoleLogs(250);
  return NextResponse.json(data);
});
