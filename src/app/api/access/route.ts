import { NextRequest, NextResponse } from "next/server";
import { getAccessControlData, executeAccessAction } from "@/server/access";
import { withAuth } from "@/server/auth";
import { accessControlActionSchema } from "@/schemas";

export const GET = withAuth(async () => {
  const data = await getAccessControlData();
  return NextResponse.json(data);
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = accessControlActionSchema.parse(await req.json());
  const response = await executeAccessAction(body);
  return NextResponse.json(response);
});
