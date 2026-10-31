import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { importWorldArchive } from "@/server/world";
import { withAuth, BadRequestError } from "@/server/core";

const MAX_WORLD_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

export const POST = withAuth(async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw new BadRequestError("No world archive uploaded");
  }

  if (file.size > MAX_WORLD_SIZE_BYTES) {
    throw new BadRequestError("Uploaded archive exceeds 500 MB limit");
  }

  const safeFileName = path.basename(file.name);
  if (
    !safeFileName ||
    file.name.includes("..") ||
    file.name.includes("/") ||
    file.name.includes("\\")
  ) {
    throw new BadRequestError("Path traversal in uploaded filename is prohibited");
  }

  const lowerName = safeFileName.toLowerCase();
  if (!lowerName.endsWith(".zip") && !lowerName.endsWith(".tar.gz") && !lowerName.endsWith(".tgz")) {
    throw new BadRequestError("Only .zip and .tar.gz world archive files are supported");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await importWorldArchive(safeFileName, buffer);

  if (!result.success) {
    throw new BadRequestError(result.error || "World import failed");
  }

  return NextResponse.json(result);
});
