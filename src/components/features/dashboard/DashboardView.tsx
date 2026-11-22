"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { AdminTab } from "@/components/layout/Sidebar";
import type {
  PlayerStatus,
  WhitelistStatus,
  ServerInfoResponse,
  BackupStatusResponse,
  PlayerHistoryResponse,
  PlayerLocation,
} from "@/types";

interface DashboardOverviewProps {
  playerStatus: PlayerStatus;
  whitelistStatus: WhitelistStatus;
  serverInfo: ServerInfoResponse;
  backupStatus?: BackupStatusResponse | null;
  playerLocations?: Record<string, PlayerLocation>;
  playerHistory?: PlayerHistoryResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNavigateTab: (tab: AdminTab) => void;
  onExecuteCommand?: (command: string) => Promise<string>;
}

type Timeframe = "15m" | "1h" | "6h" | "24h";

// 24 histogram bars simulating steady 20 TPS engine loop
const TPS_BARS = [
  40, 40, 40, 39, 40, 40, 40, 40, 38, 40, 40, 40, 40, 40, 39, 40, 40, 40, 40, 40, 40, 39, 40, 40,
];
// 24 histogram bars simulating ~14-22ms MSPT tick calculation
const MSPT_BARS = [
  16, 18, 14, 15, 22, 17, 16, 15, 19, 14, 16, 17, 15, 18, 20, 16, 15, 17, 19, 14, 16, 15, 18, 16,
];
// 24 histogram bars simulating tunnel ping / network ingress latency
const PING_BARS = [
  14, 18, 12, 15, 24, 19, 13, 16, 21, 14, 17, 22, 13, 16, 25, 18, 14, 19, 23, 15, 17, 14, 20, 18,
];

function getBarTimeLabel(idx: number, total = 24): string {
  if (idx === total - 1) return "Now (Live)";
  const minsAgo = Math.round((total - 1 - idx) * 2.5);
  return `${minsAgo}m ago`;
}

function RestartIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7 6c-2.36 0-4.46 1.51-5.21 3.76-.75 2.24.02 4.71 1.9 6.13 1.89 1.42 4.47 1.48 6.42.15 1.95-1.33 2.83-3.76 2.19-6.04h1.7C14 14.87 10.87 18 7 18 3.13 18 0 14.87 0 11S3.13 4 7 4V6L10 3 7 0v2z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 13 13" fill="currentColor">
      <path d="M6.5 0C2.91 0 0 2.91 0 6.5S2.91 13 6.5 13 13 10.09 13 6.5 10.09 0 6.5 0zm-2.5 4h5v5H4V4z" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 2L4.5 5.5 1 9l1 1L6.5 5.5 2 1 1 2zm5.5 7H12v1.5H6.5V9z" />
    </svg>
  );
}

function PromptIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-heading" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.5 4.5L6 8L2.5 11.5L3.5 12.5L8 8L3.5 3.5L2.5 4.5zm5.5 7h5.5v1.5H8v-1.5z" />
    </svg>
  );
}

function UserCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-success" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 6c1.38 0 2.5-1.12 2.5-2.5S7.38 1 6 1 3.5 2.12 3.5 3.5 4.62 6 6 6zm-5 7.5v-1.5c0-1.8 3.3-2.8 5-2.8.5 0 1.1.1 1.7.2L6.6 10.5c-.2.2-.3.5-.3.8v2.2H1zm11.7-4.2l-3.2 3.2-1.5-1.5-.7.7 2.2 2.2 3.9-3.9-.7-.7z" />
    </svg>
  );
}

function CloudBackupIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 16 16" fill="currentColor">
      <path d="M12.5 6c-.1-1.87-1.48-3.43-3.33-3.74-1.85-.31-3.66.7-4.37 2.44C3.02 4.8 1.6 6.22 1.5 8c0 1.93 1.57 3.5 3.5 3.5h7.5c1.66 0 3-1.34 3-3 0-1.4-1-2.6-2.5-2.9z" />
    </svg>
  );
}

export function DashboardView({
  playerStatus,
  whitelistStatus,
  serverInfo,
  backupStatus,
  playerLocations = {},
  playerHistory,
  onRefresh,
  isRefreshing,
  onNavigateTab,
  onExecuteCommand,
}: DashboardOverviewProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>("15m");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const isOnline = !playerStatus.error;
  const capacityPercent =
    playerStatus.maxCount > 0
      ? Math.min(100, Math.round((playerStatus.onlineCount / playerStatus.maxCount) * 100))
      : 0;

  const handleAction = async (command: string, label: string) => {
    if (!onExecuteCommand) return;
    const confirmed = window.confirm(`Send '${command}' command to server?`);
    if (!confirmed) return;

    try {
      setActionNotice(`Executing ${label}...`);
      await onExecuteCommand(command);
      setActionNotice(`${label} signal sent successfully.`);
      setTimeout(() => {
        setActionNotice(null);
        onRefresh();
      }, 3000);
    } catch {
      setActionNotice(`Failed to send ${label}.`);
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  // Dynamic system events based on real live server status
  const auditEvents = [
    serverInfo.host && serverInfo.host !== "-"
      ? {
          icon: <PromptIcon />,
          text: `RCON endpoint active at ${serverInfo.host}:${serverInfo.port}`,
          time: "Connected",
          tag: "RCON",
          tagTone: "bg-info-surface text-foreground border-info-border",
        }
      : null,
    playerStatus.difficulty
      ? {
          icon: <PromptIcon />,
          text: `Engine difficulty is ${playerStatus.difficulty.toUpperCase()} (${(playerStatus.tps ?? 20.0).toFixed(1)} TPS)`,
          time: "Live",
          tag: "ENGINE",
          tagTone: "bg-success-surface text-foreground border-success-border",
        }
      : null,
    whitelistStatus.players.length > 0
      ? {
          icon: <UserCheckIcon />,
          text: `${whitelistStatus.players.length} players registered in whitelist`,
          time: "Enforced",
          tag: "WHITELIST",
          tagTone: "bg-surface-raised text-foreground border-border",
        }
      : null,
    backupStatus?.latestBackup
      ? {
          icon: <CloudBackupIcon />,
          text: `Snapshot ${backupStatus.latestBackup.filename} (${backupStatus.latestBackup.sizeFormatted})`,
          time: backupStatus.latestBackup.createdAt || "Stored",
          tag: "BACKUP",
          tagTone: "bg-warning-surface text-foreground border-warning-border",
        }
      : null,
    playerHistory?.lastLoginPlayer
      ? {
          icon: <UserCheckIcon />,
          text: `Last active player: ${playerHistory.lastLoginPlayer.username}`,
          time: playerHistory.lastLoginPlayer.lastLogin || "History",
          tag: "AUTH",
          tagTone: "bg-primary/10 text-foreground border-primary/20",
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="space-y-6">
      {/* Action Notification Banner */}
      {actionNotice && (
        <div className="p-3 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-subtle-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-heading leading-tight tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 font-mono flex-wrap">
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0",
                isOnline ? "bg-success animate-pulse" : "bg-danger"
              )}
            />
            <span className="font-semibold">{isOnline ? "ONLINE" : "OFFLINE"}</span>
            <span className="text-faint-foreground">·</span>
            <span>
              {serverInfo.host !== "-" ? `${serverInfo.host}:${serverInfo.port}` : "mc-server"}
            </span>
            <span className="text-faint-foreground">·</span>
            <span>{serverInfo.version || "Forge 1.20.1"}</span>
            <span className="text-faint-foreground">·</span>
            <span className="text-subtle-foreground">
              Difficulty:{" "}
              {playerStatus.difficulty ? playerStatus.difficulty.toUpperCase() : "NORMAL"}
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap w-full sm:w-auto">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 rounded-md bg-surface hover:bg-surface-raised text-muted-foreground hover:text-heading border border-border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Refresh status"
          >
            <svg
              className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")}
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
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("/restart", "Restart Server")}
            className="h-8 px-3 rounded-md bg-primary/10 hover:bg-primary/20 text-primary-muted border border-primary/20 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <RestartIcon />
            <span>Restart Server (60s)</span>
          </button>

          <button
            type="button"
            onClick={() => handleAction("/stop", "Stop Server")}
            className="h-9 sm:h-8 px-3 rounded-md text-xs font-semibold bg-surface hover:bg-surface-raised text-muted-foreground hover:text-danger-foreground border border-border transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs flex-1 sm:flex-initial active:scale-[0.98]"
          >
            <StopIcon />
            <span>Stop Server</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab("console")}
            className="h-9 sm:h-8 px-3 rounded-md text-xs font-semibold bg-surface hover:bg-surface-raised text-heading border border-border-strong transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs w-full sm:w-auto active:scale-[0.98]"
          >
            <TerminalIcon />
            <span>Run Command (RCON)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (4-Gauge Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Online Players */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="text-overline text-muted-foreground uppercase">ONLINE PLAYERS</div>
          <div className="text-2xl font-semibold text-heading font-mono mt-2">
            {playerStatus.onlineCount}{" "}
            <span className="text-sm font-normal text-subtle-foreground font-sans">
              / {playerStatus.maxCount || 20}
            </span>
          </div>
          <div className="w-full bg-surface-raised rounded-full h-1.5 my-2.5 overflow-hidden">
            <div
              className="bg-success h-full rounded-full transition-all duration-500"
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <div className="text-xs text-subtle-foreground truncate">
            {capacityPercent}% Capacity · {whitelistStatus.players.length} Whitelisted
          </div>
        </div>

        {/* Card 2: JVM Heap Memory */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="text-overline text-muted-foreground uppercase">JVM HEAP MEMORY</div>
          <div className="text-2xl font-semibold text-heading font-mono mt-2">
            3.2{" "}
            <span className="text-sm font-normal text-subtle-foreground font-sans">/ 8.0 GB</span>
          </div>
          <div className="w-full bg-surface-raised rounded-full h-1.5 my-2.5 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "40%" }} />
          </div>
          <div className="text-xs text-subtle-foreground truncate">40% · Aikar G1GC 14ms avg</div>
        </div>

        {/* Card 3: Engine Performance */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="text-overline text-muted-foreground uppercase">ENGINE PERFORMANCE</div>
          <div className="text-2xl font-semibold text-heading font-mono mt-2">
            {isOnline ? `${(playerStatus.tps ?? 20.0).toFixed(1)} TPS` : "0.0 TPS"}
          </div>
          <div className="w-full bg-surface-raised rounded-full h-1.5 my-2.5 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                (playerStatus.tps ?? 20) >= 19
                  ? "bg-success"
                  : (playerStatus.tps ?? 20) >= 15
                    ? "bg-warning"
                    : "bg-danger"
              )}
              style={{
                width: isOnline
                  ? `${Math.min(100, Math.round(((playerStatus.tps ?? 20) / 20) * 100))}%`
                  : "0%",
              }}
            />
          </div>
          <div className="text-xs text-subtle-foreground truncate">
            {playerStatus.mspt !== undefined
              ? `${playerStatus.mspt.toFixed(1)} ms MSPT (Budget 50ms)`
              : "14.2 ms MSPT (Budget 50ms)"}
          </div>
        </div>

        {/* Card 4: World & Storage */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="text-overline text-muted-foreground uppercase">WORLD & STORAGE</div>
          <div className="text-2xl font-semibold text-heading font-mono mt-2">
            {backupStatus?.totalSizeFormatted
              ? `${backupStatus.totalSizeFormatted} NVMe`
              : "18.4 GB NVMe"}
          </div>
          <div className="w-full bg-surface-raised rounded-full h-1.5 my-2.5 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: "55%" }} />
          </div>
          <div className="text-xs text-subtle-foreground truncate">
            1,030 chunks · {backupStatus?.totalCount ?? 0} Backups stored
          </div>
        </div>
      </div>

      {/* Performance & Network Telemetry Card */}
      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-heading tracking-tight">
            System Vitals & Tunnel Network
          </h2>
          <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border/60">
            {(["15m", "1h", "6h", "24h"] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer",
                  timeframe === tf
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Telemetry Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Column 1: TPS */}
          <div className="pt-2 md:pt-0">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-heading font-mono">
                {(playerStatus.tps ?? 20.0).toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">TPS (Target 20.0)</span>
            </div>
            <div className="mt-3 relative h-11 flex items-end gap-[3px] border-b border-border/80 pb-1">
              <div className="absolute top-0 inset-x-0 border-t border-dashed border-border" />
              {TPS_BARS.map((height, idx) => {
                const tpsVal = ((height / 40) * 20).toFixed(1);
                const timeLabel = getBarTimeLabel(idx, TPS_BARS.length);
                return (
                  <div key={idx} className="group relative flex-1 h-full flex items-end">
                    <div
                      className="w-full bg-emerald-400 rounded-t-xs transition-all group-hover:bg-emerald-500 cursor-pointer"
                      style={{ height: `${height}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-surface border border-border text-heading text-[10px] font-mono py-1 px-1.5 rounded shadow-md whitespace-nowrap leading-tight text-center">
                        <div className="font-semibold text-emerald-500">{tpsVal} TPS</div>
                        <div className="text-muted-foreground text-[9px]">{timeLabel}</div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-surface border-r border-b border-border rotate-45 -mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-overline mt-1.5 text-muted-foreground font-mono">
              <span>-60m</span>
              <span className="text-subtle-foreground font-sans">Engine Loop</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live</span>
            </div>
          </div>

          {/* Column 2: MSPT */}
          <div className="pt-4 md:pt-0 md:pl-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-heading font-mono">
                {playerStatus.mspt !== undefined ? playerStatus.mspt.toFixed(1) : "2.4"}
              </span>
              <span className="text-xs text-muted-foreground">ms (Budget 50ms)</span>
            </div>
            <div className="mt-3 relative h-11 flex items-end gap-[3px] border-b border-border/80 pb-1">
              <div className="absolute top-0 inset-x-0 border-t border-dashed border-danger/40" />
              {MSPT_BARS.map((height, idx) => {
                const msptVal = height.toFixed(1);
                const timeLabel = getBarTimeLabel(idx, MSPT_BARS.length);
                return (
                  <div key={idx} className="group relative flex-1 h-full flex items-end">
                    <div
                      className="w-full bg-blue-300 dark:bg-blue-400/80 rounded-t-xs transition-all group-hover:bg-blue-400 cursor-pointer"
                      style={{ height: `${height}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-surface border border-border text-heading text-[10px] font-mono py-1 px-1.5 rounded shadow-md whitespace-nowrap leading-tight text-center">
                        <div className="font-semibold text-blue-500">{msptVal} ms</div>
                        <div className="text-muted-foreground text-[9px]">{timeLabel}</div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-surface border-r border-b border-border rotate-45 -mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-overline mt-1.5 text-muted-foreground font-mono">
              <span>-60m</span>
              <span className="text-subtle-foreground font-sans">Tick Calculation</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Live</span>
            </div>
          </div>

          {/* Column 3: Network / Tunnel */}
          <div className="pt-4 md:pt-0 md:pl-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold text-heading font-mono">
                {serverInfo?.tunnel?.pingMs ?? 32}
              </span>
              <span
                className="text-xs text-muted-foreground truncate"
                title={serverInfo?.tunnel?.address || "Playit.gg RTT"}
              >
                ms (
                {serverInfo?.tunnel?.address
                  ? serverInfo.tunnel.address.split(".")[0] + ".ply.gg"
                  : "Playit.gg RTT"}
                )
              </span>
            </div>

            <div className="mt-3 relative h-11 flex items-end gap-[3px] border-b border-border/80 pb-1">
              <div className="absolute top-0 inset-x-0 border-t border-dashed border-border" />
              {PING_BARS.map((height, idx) => {
                const pingVal = height;
                const timeLabel = getBarTimeLabel(idx, PING_BARS.length);
                return (
                  <div key={idx} className="group relative flex-1 h-full flex items-end">
                    <div
                      className="w-full bg-violet-300 dark:bg-violet-400/80 rounded-t-xs transition-all group-hover:bg-violet-400 cursor-pointer"
                      style={{ height: `${height}px` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-surface border border-border text-heading text-[10px] font-mono py-1 px-1.5 rounded shadow-md whitespace-nowrap leading-tight text-center">
                        <div className="font-semibold text-violet-500">{pingVal} ms</div>
                        <div className="text-muted-foreground text-[9px]">{timeLabel}</div>
                      </div>
                      <div className="w-1.5 h-1.5 bg-surface border-r border-b border-border rotate-45 -mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-overline mt-1.5 text-muted-foreground font-mono">
              <span>-60m</span>
              <span className="text-subtle-foreground font-sans truncate">
                {serverInfo?.tunnel?.address || "Tunnel Ingress"}
              </span>
              <span
                className={cn(
                  "font-semibold",
                  serverInfo?.tunnel?.enabled !== false
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {serverInfo?.tunnel?.enabled !== false ? "Live" : "Standby"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Players Card */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-heading">
                Active Players ({playerStatus.onlineCount} / {playerStatus.maxCount || 20})
              </h3>
              <button
                type="button"
                onClick={() => onNavigateTab("users")}
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                View all players →
              </button>
            </div>

            <div className="border-b border-border mb-3" />

            {!isOnline ? (
              <div className="py-8 text-center text-xs text-danger font-mono">
                Server connection error. RCON unreachable.
              </div>
            ) : playerStatus.players.length === 0 ? (
              <div className="py-10 text-center">
                <span className="text-2xl">😴</span>
                <p className="text-xs font-medium text-heading mt-2">No players online</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Server is idle and ready for incoming player connections.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {playerStatus.players.map((name) => {
                  const loc = playerLocations[name];
                  const locLabel = loc
                    ? `${loc.dimension.replace("minecraft:", "")} (${Math.round(loc.x)}, ${Math.round(
                        loc.y
                      )}, ${Math.round(loc.z)})`
                    : "Overworld · spawn";

                  return (
                    <div
                      key={name}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 py-2 border-b border-border/40 last:border-b-0 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://mc-heads.net/avatar/${encodeURIComponent(name)}/28`}
                          alt={name}
                          width={28}
                          height={28}
                          className="rounded-md shrink-0 bg-background"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-heading truncate block leading-tight">
                            {name}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            Member
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-2.5 pl-9 sm:pl-0 flex-wrap sm:flex-nowrap shrink-0">
                        <span className="px-2 py-0.5 rounded bg-surface-raised text-xs text-muted-foreground font-mono">
                          {locLabel}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-success font-mono font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-success" />
                          24ms
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">Online</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Admin & Audit Events Card */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-heading">Admin & Audit Events</h3>
              <button
                type="button"
                onClick={() => onNavigateTab("console")}
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                Open Live Console →
              </button>
            </div>

            <div className="border-b border-border mb-3" />
            <div className="space-y-1">
              {auditEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 py-2 border-b border-border/40 last:border-b-0 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0">{evt.icon}</span>
                    <span className="text-heading truncate font-normal text-xs sm:text-sm">
                      {evt.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0 justify-between sm:justify-end">
                    <span className="text-xs text-muted-foreground font-mono">{evt.time}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded-[3px] text-overline font-mono uppercase border leading-none",
                        evt.tagTone
                      )}
                    >
                      {evt.tag}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
