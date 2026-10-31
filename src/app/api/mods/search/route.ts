import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/server/auth";
import { BadRequestError } from "@/server/core";

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "";
  const loader = searchParams.get("loader") || "";
  const gameVersion = searchParams.get("game_version") || "";
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 20, 1), 100);

  const facets: string[][] = [["project_type:mod"]];

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
    throw new BadRequestError(`Modrinth API returned status ${response.status}`);
  }

  const data = await response.json();
  return NextResponse.json(data);
});
