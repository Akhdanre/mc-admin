import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`https://api.modrinth.com/v2/project/${id}/version`, {
      headers: {
        "User-Agent": "mc-dashboard/0.1.5 (github.com/akhdanre/mc-dashboard)",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { versions: [], error: `Modrinth API returned ${response.status}` },
        { status: 502 }
      );
    }

    const versions = await response.json();
    return NextResponse.json({ versions });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch project versions";
    return NextResponse.json({ versions: [], error: message }, { status: 500 });
  }
}
