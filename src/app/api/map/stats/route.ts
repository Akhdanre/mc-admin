import { NextResponse } from "next/server";
import { executeRconCommand } from "@/server/rcon";
import { withAuth } from "@/server/auth";

export const GET = withAuth(async () => {
  try {
    const [statsRaw, pauseRaw] = await Promise.all([
      executeRconCommand("dynmap stats").catch(() => ""),
      executeRconCommand("dynmap pause check").catch(() => ""),
    ]);

    const totalsMatch = statsRaw.match(
      /TOTALS:\s*processed=(\d+),\s*rendered=(\d+),\s*updated=(\d+)/
    );
    const cacheMatch = statsRaw.match(/Cache hit rate:\s*([0-9.]+%)/);
    const isPaused = pauseRaw.toLowerCase().includes("renders are paused");

    return NextResponse.json({
      tilesRendered: totalsMatch && totalsMatch[2] ? Number(totalsMatch[2]) : null,
      tilesUpdated: totalsMatch && totalsMatch[3] ? Number(totalsMatch[3]) : null,
      cacheHitRate: cacheMatch ? cacheMatch[1] : null,
      isPaused,
    });
  } catch {
    return NextResponse.json({
      tilesRendered: null,
      tilesUpdated: null,
      cacheHitRate: null,
      isPaused: false,
    });
  }
});
