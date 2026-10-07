import { NextResponse } from "next/server";
import { getBackupStatus, triggerBackup, deleteBackup, setRetention, restoreBackup } from "@/server/services/backup";

interface BackupActionBody {
  action?: "trigger" | "delete" | "retention" | "restore";
  filename?: string;
  retentionDays?: number;
}

export async function GET() {
  const status = await getBackupStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  let body: BackupActionBody;
  try {
    body = (await request.json()) as BackupActionBody;
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
  }

  switch (body.action) {
    case "trigger": {
      const result = await triggerBackup();
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }
    case "delete": {
      if (!body.filename) {
        return NextResponse.json({ success: false, error: "filename is required" }, { status: 400 });
      }
      const result = await deleteBackup(body.filename);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }
    case "retention": {
      if (typeof body.retentionDays !== "number" || body.retentionDays < 1 || body.retentionDays > 365) {
        return NextResponse.json(
          { success: false, error: "retentionDays must be between 1 and 365" },
          { status: 400 }
        );
      }
      const result = await setRetention(body.retentionDays);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }
    case "restore": {
      if (!body.filename) {
        return NextResponse.json({ success: false, error: "filename is required" }, { status: 400 });
      }
      const result = await restoreBackup(body.filename);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }
    default:
      return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  }
}
