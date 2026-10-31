import { NextRequest, NextResponse } from "next/server";
import { setServerGamerule } from "@/server/world";
import { withAuth } from "@/server/auth";
import { gameruleActionSchema } from "@/schemas";

export const POST = withAuth(async (req: NextRequest) => {
  const body = gameruleActionSchema.parse(await req.json());
  const result = await setServerGamerule(body.rule, body.value);
  return NextResponse.json(result);
});
