import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { withAuth } from "@/server/auth";
import { config, BadRequestError, NotFoundError } from "@/server/core";
import { isSafeFilename } from "@/server/backup";

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get("filename");

  if (!filename || !isSafeFilename(filename) || !filename.endsWith(".tar.gz")) {
    throw new BadRequestError("Valid backup filename required");
  }

  const safeName = path.basename(filename);
  const filePath = path.join(config.paths.backups, safeName);

  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) {
      throw new NotFoundError("Backup archive not found");
    }

    const nodeStream = fs.createReadStream(filePath);
    const webStream = new ReadableStream({
      start(controller) {
        nodeStream.on("data", (chunk) => controller.enqueue(chunk));
        nodeStream.on("end", () => controller.close());
        nodeStream.on("error", (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": "application/gzip",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(stat.size),
      },
    });
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof BadRequestError) {
      throw error;
    }
    throw new NotFoundError("Backup file does not exist");
  }
});
