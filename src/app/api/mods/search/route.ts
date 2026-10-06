import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const loader = searchParams.get("loader") || "";
    const gameVersion = searchParams.get("game_version") || "";
    const limit = Number(searchParams.get("limit")) || 20;

    const facets: string[][] = [
      ['project_type:mod'],
    ];

    if (loader) {
      facets.push([`categories:${loader}`]);
    }
    if (gameVersion) {
      facets.push([`versions:${gameVersion}`]);
    }

    const url = new URL("https://api.modrinth.com/v2/search");
    url.searchParams.set("query", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("facets", JSON.stringify(facets));

    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "mc-dashboard/0.1.5 (github.com/akhdanre/mc-dashboard)",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { hits: [], total_hits: 0, error: `Modrinth API returned ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to query Modrinth";
    return NextResponse.json({ hits: [], total_hits: 0, error: message }, { status: 500 });
  }
}
