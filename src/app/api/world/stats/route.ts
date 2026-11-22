import { NextResponse } from "next/server";
import { getWorldStats } from "@/server/world";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const stats = await getWorldStats();
  return NextResponse.json(stats);
});
