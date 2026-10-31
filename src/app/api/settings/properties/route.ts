import { NextRequest, NextResponse } from "next/server";
import { getServerProperties, saveServerProperties } from "@/server/settings";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const properties = await getServerProperties();
  return NextResponse.json({ properties });
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = (await req.json()) as Record<string, string>;
  const updated = await saveServerProperties(body);
  return NextResponse.json({ properties: updated });
});
