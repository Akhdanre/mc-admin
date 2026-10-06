import { NextResponse } from "next/server";
import { getBackupStatus, triggerBackup } from "@/services/backup";

export async function GET() {
  const status = await getBackupStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const result = await triggerBackup();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
