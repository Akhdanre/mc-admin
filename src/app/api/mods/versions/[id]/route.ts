import { NextRequest, NextResponse } from "next/server";
import { withAuth, BadRequestError } from "@/server/core";

export const GET = withAuth(
  async (
    _request: NextRequest,
    context?: { params: Promise<{ id: string }> }
  ) => {
    if (!context?.params) {
      throw new BadRequestError("Project ID parameter required");
    }
    const { id } = await context.params;
    const response = await fetch(`https://api.modrinth.com/v2/project/${id}/version`, {
      headers: {
        "User-Agent": "mc-dashboard/0.1.5 (github.com/akhdanre/mc-dashboard)",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new BadRequestError(`Modrinth API returned status ${response.status}`);
    }

    const versions = await response.json();
    return NextResponse.json({ versions });
  }
);
