import { NextResponse } from "next/server";
import { importWorldArchive } from "@/server/services/worldImport";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No world archive uploaded" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith(".zip") && !name.endsWith(".tar.gz") && !name.endsWith(".tgz")) {
      return NextResponse.json(
        { success: false, error: "Only .zip and .tar.gz files are allowed" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await importWorldArchive(file.name, buffer);

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "World import failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
