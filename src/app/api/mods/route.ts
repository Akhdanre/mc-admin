import { NextResponse } from "next/server";
import { listInstalledMods, toggleMod, deleteMod, saveModFile } from "@/server/services/mods";

export async function GET() {
  const mods = await listInstalledMods();
  return NextResponse.json({ mods });
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { fileName?: string; enabled?: boolean };
    if (!body.fileName || typeof body.enabled !== "boolean") {
      return NextResponse.json({ success: false, error: "fileName and enabled (boolean) required" }, { status: 400 });
    }

    const result = await toggleMod(body.fileName, body.enabled);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to toggle mod";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");
    if (!fileName) {
      return NextResponse.json({ success: false, error: "fileName query parameter required" }, { status: 400 });
    }

    await deleteMod(fileName);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete mod";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    // Multipart upload handler
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }

      if (!file.name.endsWith(".jar")) {
        return NextResponse.json({ success: false, error: "Only .jar files allowed" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const savedName = await saveModFile(file.name, buffer);

      return NextResponse.json({ success: true, fileName: savedName });
    }

    // Direct install by URL (e.g. from Modrinth)
    const body = (await request.json()) as { downloadUrl?: string; fileName?: string };
    if (!body.downloadUrl || !body.fileName) {
      return NextResponse.json({ success: false, error: "downloadUrl and fileName required" }, { status: 400 });
    }

    if (!body.fileName.endsWith(".jar")) {
      return NextResponse.json({ success: false, error: "Target fileName must end with .jar" }, { status: 400 });
    }

    const response = await fetch(body.downloadUrl);
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to download mod: ${response.statusText}` },
        { status: 502 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const savedName = await saveModFile(body.fileName, buffer);

    return NextResponse.json({ success: true, fileName: savedName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process mod upload/install";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
