import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { config } from "@/server/config";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename");

    if (!filename) {
      return NextResponse.json({ error: "filename query parameter required" }, { status: 400 });
    }

    const safeName = path.basename(filename);
    if (!safeName.endsWith(".tar.gz")) {
      return NextResponse.json({ error: "Invalid backup filename" }, { status: 400 });
    }

    const filePath = path.join(config.paths.backups, safeName);

    try {
      const stat = await fsp.stat(filePath);
      if (!stat.isFile()) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
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
          "Content-Length": stat.size.toString(),
        },
      });
    } catch {
      return NextResponse.json({ error: "Backup file not found" }, { status: 404 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
