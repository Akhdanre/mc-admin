import { NextResponse } from "next/server";
import { getTelemetryData } from "@/server/telemetry";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  const telemetry = await getTelemetryData();
  return NextResponse.json(telemetry);
});
