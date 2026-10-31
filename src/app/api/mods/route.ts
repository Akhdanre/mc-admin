import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { listInstalledMods, toggleMod, deleteMod, saveModFile } from "@/server/mods";
import { withAuth, BadRequestError } from "@/server/core";

function assertSafeModFileName(fileName: string): string {
  const clean = path.basename(fileName);
  if (!clean || fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    throw new BadRequestError("Path traversal in mod filename is prohibited");
  }
  return clean;
}

export const GET = withAuth(async () => {
  const mods = await listInstalledMods();
  return NextResponse.json({ mods });
});

export const PATCH = withAuth(async (req: NextRequest) => {
  const body = (await req.json()) as { fileName?: string; enabled?: boolean };
  if (!body.fileName || typeof body.enabled !== "boolean") {
    throw new BadRequestError("fileName and enabled (boolean) required");
  }

  const safeFileName = assertSafeModFileName(body.fileName);
  const result = await toggleMod(safeFileName, body.enabled);
  return NextResponse.json(result);
});

export const DELETE = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get("fileName");
  if (!fileName) {
    throw new BadRequestError("fileName query parameter required");
  }

  const safeFileName = assertSafeModFileName(fileName);
  await deleteMod(safeFileName);
  return NextResponse.json({ success: true });
});

export const POST = withAuth(async (req: NextRequest) => {
  const contentType = req.headers.get("content-type") || "";

  // Multipart upload handler
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new BadRequestError("No file provided");
    }

    const safeName = assertSafeModFileName(file.name);
    if (!safeName.endsWith(".jar")) {
      throw new BadRequestError("Only .jar files allowed");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const savedName = await saveModFile(safeName, buffer);

    return NextResponse.json({ success: true, fileName: savedName });
  }

  // Direct install by URL (e.g. from Modrinth)
  const body = (await req.json()) as { downloadUrl?: string; fileName?: string };
  if (!body.downloadUrl || !body.fileName) {
    throw new BadRequestError("downloadUrl and fileName required");
  }

  const safeName = assertSafeModFileName(body.fileName);
  if (!safeName.endsWith(".jar")) {
    throw new BadRequestError("Target fileName must end with .jar");
  }

  const response = await fetch(body.downloadUrl);
  if (!response.ok) {
    throw new BadRequestError(`Failed to download mod: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const savedName = await saveModFile(safeName, buffer);

  return NextResponse.json({ success: true, fileName: savedName });
});
