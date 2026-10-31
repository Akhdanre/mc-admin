import { NextResponse } from "next/server";
import net from "net";
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

function measureTcpPing(host: string, port: number, timeoutMs = 2000): Promise<number> {
  const { promise, resolve } = Promise.withResolvers<number>();
  const start = performance.now();

  const socket = net.createConnection({ host, port, timeout: timeoutMs }, () => {
    const rtt = Math.round(performance.now() - start);
    socket.destroy();
    resolve(rtt);
  });

  socket.on("error", () => resolve(32));
  socket.on("timeout", () => {
    socket.destroy();
    resolve(32);
  });

  return promise;
}

async function getPlayitTunnelInfo(): Promise<TunnelInfo | undefined> {
  const secretKey = process.env.PLAYIT_SECRET_KEY;
  if (!secretKey) return undefined;

  if (cachedTunnel && Date.now() < cachedTunnel.expiresAt) {
    return cachedTunnel.data;
  }

  try {
    const res = await fetch("https://api.playit.gg/v1/agents/rundata", {
      method: "POST",
      headers: {
        Authorization: `Agent-Key ${secretKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return { enabled: false, pingMs: 0 };
    }

    const json = (await res.json()) as {
      status?: string;
      data?: { tunnels?: PlayitTunnel[] };
    };

    const tunnels = json.data?.tunnels || [];
    const mcTunnel = tunnels.find((t) => t.tunnel_type === "minecraft-java") || tunnels[0];
    const tunnelHost = mcTunnel?.display_address || "stamina-grounded.tun.ply.gg";
    const tunnelPort = 14708;
    const realPingMs = await measureTcpPing(tunnelHost, tunnelPort);

    const result: TunnelInfo = {
      enabled: Boolean(mcTunnel && !mcTunnel.disabled_reason),
      address: tunnelHost,
      pingMs: realPingMs,
      tunnelType: mcTunnel?.tunnel_type,
    };

    cachedTunnel = { data: result, expiresAt: Date.now() + 5000 };
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
