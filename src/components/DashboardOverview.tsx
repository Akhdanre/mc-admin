"use client";

import type { PlayerStatus, WhitelistStatus, ServerInfoResponse, PlayerHistoryResponse, BackupStatusResponse } from "@/types";
import { BackupManager } from "@/components/BackupManager";

interface DashboardOverviewProps {
  playerStatus: PlayerStatus;
  whitelistStatus: WhitelistStatus;
  serverInfo: ServerInfoResponse;
  playerHistory?: PlayerHistoryResponse | null;
  backupStatus?: BackupStatusResponse | null;
  onRefresh: () => void;
  isRefreshing: boolean;
  onNavigateTab: (tab: "users" | "commands") => void;
  onTriggerBackup: () => Promise<void>;
  isBackingUp: boolean;
}

export function DashboardOverview({
  playerStatus,
  whitelistStatus,
  serverInfo,
  playerHistory,
  backupStatus,
  onRefresh,
  isRefreshing,
  onNavigateTab,
  onTriggerBackup,
  isBackingUp,
}: DashboardOverviewProps) {
  const isOnline = !playerStatus.error;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
              <span>Server Overview</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Minecraft Server Management Hub
            </h2>
            <p className="text-sm text-slate-300 mt-1">
              Live monitoring, access control, and remote administration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl transition border border-slate-700 flex items-center gap-2 cursor-pointer shadow-xs"
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
            </button>

            <button
              onClick={() => onNavigateTab("commands")}
              className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              <span>Open Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Online Players</p>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm">👤</span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-white">{playerStatus.onlineCount}</span>
            <span className="text-sm text-slate-500 font-medium">/ {playerStatus.maxCount} max</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{
                width: `${
                  playerStatus.maxCount > 0
                    ? Math.min(100, (playerStatus.onlineCount / playerStatus.maxCount) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Whitelist Access</p>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm">🛡️</span>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-extrabold text-indigo-400">
              {whitelistStatus.players.length}
            </span>
            <span className="text-sm text-slate-500 font-medium">registered</span>
          </div>
          <button
            onClick={() => onNavigateTab("users")}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-3 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Manage users</span>
            <span>&rarr;</span>
          </button>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Last Login</p>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm">🕒</span>
          </div>
          {playerHistory?.lastLoginPlayer ? (
            <div className="mt-3">
              <p className="text-base font-bold text-purple-300 truncate">
                {playerHistory.lastLoginPlayer.username}
              </p>
              <p className="text-xs text-slate-400 mt-1">
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
              </p>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-base font-semibold text-slate-400">-</p>
              <p className="text-xs text-slate-500 mt-1">No recorded logins</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Target Server</p>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg text-sm">🌐</span>
          </div>
          <p className="text-base font-semibold text-white mt-3 font-mono truncate">
            {serverInfo.host || "-"}
          </p>
          <p className="text-xs text-slate-400 mt-1">RCON Port: {serverInfo.port || 25575}</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Sync Status</p>
            <span className="p-2 bg-sky-500/10 text-sky-400 rounded-lg text-sm">⏱️</span>
          </div>
          <p className="text-base font-semibold text-white mt-3">{playerStatus.updatedAt || "-"}</p>
          <p className="text-xs text-slate-400 mt-1">Auto-polls every 4 seconds</p>
        </div>
      </div>

      {/* Active Players & Server Quick Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Players Widget */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-white text-base">Active In-Game Players</h3>
              <p className="text-xs text-slate-400">Currently logged into the server right now</p>
            </div>
            <button
              onClick={() => onNavigateTab("users")}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
            >
              View All Users &rarr;
            </button>
          </div>

          {!isOnline ? (
            <div className="py-12 text-center border border-dashed border-rose-900/40 rounded-xl bg-rose-500/5">
              <span className="text-3xl">⚠️</span>
              <p className="text-rose-400 text-sm font-semibold mt-2">Cannot Connect to RCON</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-mono">
                {playerStatus.error}
              </p>
            </div>
          ) : playerStatus.players.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
              <span className="text-3xl">😴</span>
              <p className="text-slate-300 text-sm font-semibold mt-2">No Players Online</p>
              <p className="text-xs text-slate-400 mt-1">The server is empty at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playerStatus.players.map((name) => (
                <div
                  key={name}
                  className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-xl hover:border-slate-700 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://mc-heads.net/avatar/${name}/40`}
                    alt={name}
                    className="w-10 h-10 rounded-lg bg-slate-800"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://mc-heads.net/avatar/Steve/40";
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{name}</p>
                    <p className="text-xs text-emerald-400 font-medium">In Game</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Server Quick Info Card */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base mb-1">Server Information</h3>
            <p className="text-xs text-slate-400 mb-4">Configuration details</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs p-3 bg-slate-950/80 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">RCON Host</span>
                <span className="font-mono text-white font-medium">{serverInfo.host}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-slate-950/80 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">RCON Port</span>
                <span className="font-mono text-white font-medium">{serverInfo.port}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 bg-slate-950/80 rounded-xl border border-slate-800/60">
                <span className="text-slate-400">Status</span>
                <span
                  className={`font-semibold ${
                    isOnline ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isOnline ? "Operational" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <button
              onClick={() => onNavigateTab("commands")}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-700 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Quick Commands</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backup Management */}
      <BackupManager
        backupStatus={backupStatus ?? null}
        onRefresh={onRefresh}
        onTriggerBackup={onTriggerBackup}
        isBackingUp={isBackingUp}
      />
    </div>
  );
}
