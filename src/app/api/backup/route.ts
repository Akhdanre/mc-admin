import { NextRequest, NextResponse } from "next/server";
import {
  getBackupStatus,
  triggerBackup,
  deleteBackup,
  setRetention,
  restoreBackup,
} from "@/server/backup";
import { withAuth } from "@/server/auth";
import { BadRequestError } from "@/server/core";
import { backupActionSchema } from "@/schemas";

export const GET = withAuth(async () => {
  const status = await getBackupStatus();
  return NextResponse.json(status);
});

export const POST = withAuth(async (req: NextRequest) => {
  const body = backupActionSchema.parse(await req.json());
  const action = body.action || "trigger";

  switch (action) {
    case "trigger": {
      const res = await triggerBackup();
      return NextResponse.json(res, { status: res.success ? 200 : 500 });
    }

    case "delete": {
      if (!body.filename) {
        throw new BadRequestError("Filename is required for delete action");
      }
      const res = await deleteBackup(body.filename);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    case "retention": {
      if (!body.retentionDays) {
        throw new BadRequestError("retentionDays is required");
      }
      const res = await setRetention(body.retentionDays);
      return NextResponse.json(res);
    }

    case "restore": {
      if (!body.filename) {
        throw new BadRequestError("Filename is required for restore action");
      }
      const res = await restoreBackup(body.filename);
      return NextResponse.json(res, { status: res.success ? 200 : 400 });
    }

    default:
      throw new BadRequestError("Unknown backup action");
  }
});
