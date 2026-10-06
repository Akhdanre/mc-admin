"use client";

import { Badge, Body, Button, Card, CardLabel, Caption, Mono, Muted } from "@/components/ui";
import type { PlayerStatus, WhitelistStatus, ServerInfoResponse, PlayerHistoryResponse } from "@/types";

interface DashboardOverviewProps {
  playerStatus: PlayerStatus;
  whitelistStatus: WhitelistStatus;
  serverInfo: ServerInfoResponse;
  playerHistory?: PlayerHistoryResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNavigateTab: (tab: "users" | "commands") => void;
}

export function DashboardOverview({
  playerStatus,
  whitelistStatus,
  serverInfo,
  playerHistory,
  onRefresh,
  isRefreshing,
  onNavigateTab,
}: DashboardOverviewProps) {
  const isOnline = !playerStatus.error;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-surface/80 to-surface border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Badge tone="primary" className="mb-3">
              <span>Server Overview</span>
            </Badge>
            <h2 className="text-2xl font-bold text-heading tracking-tight">
              Minecraft Server Management Hub
            </h2>
            <Body className="mt-1">
              Live monitoring, access control, and remote administration.
            </Body>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              className="text-xs shadow-xs"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <svg
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isRefreshing ? "Syncing..." : "Sync Server"}</span>
            </Button>

            <Button
              variant="primary"
              size="md"
              className="text-xs shadow-lg shadow-indigo-600/25"
              onClick={() => onNavigateTab("commands")}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>Open Console</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:border-border-strong transition">
          <div className="flex items-center justify-between">
            <CardLabel className="font-semibold tracking-wider">Online Players</CardLabel>
            <Badge tone="success" className="rounded-lg px-2 py-2 text-sm">
              <span>👤</span>
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-heading">{playerStatus.onlineCount}</span>
            <span className="text-sm text-subtle-foreground font-medium">
              / {playerStatus.maxCount} max
            </span>
          </div>
          <div className="w-full bg-surface-raised rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-success h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${
                  playerStatus.maxCount > 0
                    ? Math.min(100, (playerStatus.onlineCount / playerStatus.maxCount) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </Card>

        <Card className="hover:border-border-strong transition">
          <div className="flex items-center justify-between">
            <CardLabel className="font-semibold tracking-wider">Whitelist Access</CardLabel>
            <Badge tone="primary" className="rounded-lg px-2 py-2 text-sm">
              <span>🛡️</span>
            </Badge>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-primary-muted">
              {whitelistStatus.players.length}
            </span>
            <span className="text-sm text-subtle-foreground font-medium">registered</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="px-0 mt-3 text-primary-muted hover:text-primary hover:bg-transparent"
            onClick={() => onNavigateTab("users")}
          >
            <span>Manage users</span>
            <span>&rarr;</span>
          </Button>
        </Card>

        <Card className="hover:border-border-strong transition">
          <div className="flex items-center justify-between">
            <CardLabel className="font-semibold tracking-wider">Last Login</CardLabel>
            <Badge tone="primary" className="rounded-lg px-2 py-2 text-sm">
              <span>🕒</span>
            </Badge>
          </div>
          {playerHistory?.lastLoginPlayer ? (
            <div className="mt-3">
              <p className="text-base font-bold text-primary-muted truncate">
                {playerHistory.lastLoginPlayer.username}
              </p>
              <Caption className="mt-1">
                {playerHistory.lastLoginPlayer.lastLogin
                  ? new Date(playerHistory.lastLoginPlayer.lastLogin).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : playerHistory.lastLoginPlayer.lastSeen
                  ? new Date(playerHistory.lastLoginPlayer.lastSeen).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "-"}
              </Caption>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-base font-semibold text-muted-foreground">-</p>
              <Caption className="mt-1">No recorded logins</Caption>
            </div>
          )}
        </Card>

        <Card className="hover:border-border-strong transition">
          <div className="flex items-center justify-between">
            <CardLabel className="font-semibold tracking-wider">Target Server</CardLabel>
            <Badge tone="warning" className="rounded-lg px-2 py-2 text-sm">
              <span>🌐</span>
            </Badge>
          </div>
          <p className="text-base font-semibold text-heading mt-3 font-mono truncate">
            {serverInfo.host || "-"}
          </p>
          <Caption className="mt-1">RCON Port: {serverInfo.port || 25575}</Caption>
        </Card>

        <Card className="hover:border-border-strong transition">
          <div className="flex items-center justify-between">
            <CardLabel className="font-semibold tracking-wider">Sync Status</CardLabel>
            <Badge tone="info" className="rounded-lg px-2 py-2 text-sm">
              <span>⏱️</span>
            </Badge>
          </div>
          <p className="text-base font-semibold text-heading mt-3">{playerStatus.updatedAt || "-"}</p>
          <Caption className="mt-1">Auto-polls every 4 seconds</Caption>
        </Card>
      </div>

      {/* Active Players & Server Quick Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Players Widget */}
        <Card className="lg:col-span-2" padding="lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-heading text-base">Active In-Game Players</h3>
              <Caption>Currently logged into the server right now</Caption>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="px-0 text-primary-muted hover:text-primary hover:bg-transparent"
              onClick={() => onNavigateTab("users")}
            >
              View All Users &rarr;
            </Button>
          </div>

          {!isOnline ? (
            <div className="py-12 text-center border border-dashed border-rose-900/40 rounded-xl bg-rose-500/5">
              <span className="text-3xl">⚠️</span>
              <p className="text-danger-muted text-sm font-semibold mt-2">Cannot Connect to RCON</p>
              <Muted className="max-w-sm mx-auto mt-1 font-mono">{playerStatus.error}</Muted>
            </div>
          ) : playerStatus.players.length === 0 ? (
            <Card tone="muted" padding="none" className="text-center py-12">
              <span className="text-3xl">😴</span>
              <p className="text-foreground text-sm font-semibold mt-2">No Players Online</p>
              <Muted className="mt-1">The server is empty at the moment.</Muted>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playerStatus.players.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 p-3 bg-overlay/80 border border-border rounded-xl hover:border-border-strong transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://mc-heads.net/avatar/${name}/40`}
                    alt={name}
                    className="w-10 h-10 rounded-lg bg-surface-raised"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://mc-heads.net/avatar/Steve/40";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-heading truncate">{name}</p>
                    <p className="text-xs text-success-muted font-medium">In Game</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Server Quick Info Card */}
        <Card padding="lg" className="flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-heading text-base mb-1">Server Information</h3>
            <Caption className="mb-4">Configuration details</Caption>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 bg-overlay/80 rounded-xl border border-border/60">
                <span className="text-muted-foreground">RCON Host</span>
                <Mono className="text-heading font-medium">{serverInfo.host}</Mono>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-overlay/80 rounded-xl border border-border/60">
                <span className="text-muted-foreground">RCON Port</span>
                <Mono className="text-heading font-medium">{serverInfo.port}</Mono>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-overlay/80 rounded-xl border border-border/60">
                <span className="text-muted-foreground">Status</span>
                <span className={isOnline ? "text-success-muted font-semibold" : "text-danger-muted font-semibold"}>
                  {isOnline ? "Operational" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <Button
              variant="secondary"
              className="w-full py-2.5"
              onClick={() => onNavigateTab("commands")}
            >
              <span>Quick Commands</span>
              <span>&rarr;</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
