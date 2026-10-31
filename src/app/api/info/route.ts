import { NextResponse } from "next/server";
import { getAppSettings } from "@/server/settings";
import { withAuth } from "@/server/auth";
import type { TunnelInfo } from "@/types";

interface PlayitTunnel {
  name: string;
  display_address: string;
  tunnel_type: string;
  disabled_reason: string | null;
}

let cachedTunnel: { data: TunnelInfo; expiresAt: number } | null = null;

async function getPlayitTunnelInfo(): Promise<TunnelInfo | undefined> {
  const secretKey = process.env.PLAYIT_SECRET_KEY;
  if (!secretKey) return undefined;

  if (cachedTunnel && Date.now() < cachedTunnel.expiresAt) {
    return cachedTunnel.data;
  }

  try {
    const start = performance.now();
    const res = await fetch("https://api.playit.gg/v1/agents/rundata", {
      method: "POST",
      headers: {
        Authorization: `Agent-Key ${secretKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });

    const pingMs = Math.round(performance.now() - start);
    if (!res.ok) {
      return { enabled: false, pingMs };
    }

    const json = (await res.json()) as {
      status?: string;
      data?: { tunnels?: PlayitTunnel[] };
    };

    const tunnels = json.data?.tunnels || [];
    const mcTunnel = tunnels.find((t) => t.tunnel_type === "minecraft-java") || tunnels[0];

    const result: TunnelInfo = {
      enabled: Boolean(mcTunnel && !mcTunnel.disabled_reason),
      address: mcTunnel?.display_address,
      pingMs,
      tunnelType: mcTunnel?.tunnel_type,
    };

    cachedTunnel = { data: result, expiresAt: Date.now() + 30_000 };
    return result;
  } catch {
    return { enabled: false };
  }
}

export const GET = withAuth(async () => {
  const settings = await getAppSettings();
  const tunnel = await getPlayitTunnelInfo();
  return NextResponse.json({
    host: process.env.RCON_HOST || settings.rconHost,
    port: Number(process.env.RCON_PORT) || settings.rconPort,
    mapUrl: process.env.NEXT_PUBLIC_MAP_URL || settings.mapUrl,
    version: "Forge 1.20.1",
    tunnel,
  });
});
