"use client";

import { useState } from "react";
import type { BackupStatusResponse } from "@/types";

interface BackupPageProps {
  backupStatus: BackupStatusResponse | null;
  onRefresh: () => void;
  onTriggerBackup: () => Promise<void>;
  onDeleteBackup: (filename: string) => Promise<void>;
  onSetRetention: (days: number) => Promise<void>;
  isBackingUp: boolean;
  isBusy: boolean;
}

export function BackupPage({
  backupStatus,
  onRefresh,
  onTriggerBackup,
  onDeleteBackup,
  onSetRetention,
  isBackingUp,
  isBusy,
}: BackupPageProps) {
  const [retentionInput, setRetentionInput] = useState<string>(
    String(backupStatus?.retentionDays ?? 7)
  );
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "largest">("newest");

  const backups = backupStatus?.backups || [];
  const latest = backupStatus?.latestBackup;
  const currentRetention = backupStatus?.retentionDays ?? 7;

  const filtered = backups
    .filter((b) => b.filename.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "oldest") return a.mtime - b.mtime;
      if (sortOrder === "largest") return b.sizeBytes - a.sizeBytes;
      return b.mtime - a.mtime;
    });

  // Estimated expiry: created + retention days
  const expiryOf = (createdAt: string) => {
    const expires = new Date(new Date(createdAt).getTime() + currentRetention * 86400000);
    const daysLeft = Math.ceil((expires.getTime() - Date.now()) / 86400000);
    return { expires, daysLeft };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <span>World Snapshot & Retention Control</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Backup Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Trigger archives, prune old snapshots, and configure the automatic retention policy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isBusy || isBackingUp}
            className="px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl transition border border-slate-700 cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={onTriggerBackup}
            disabled={isBackingUp || isBusy}
            className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            {isBackingUp ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Creating Backup...</span>
              </>
            ) : (
              <>
                <span>📦</span>
                <span>Trigger Backup Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Backups</p>
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-sm">🗃️</span>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{backupStatus?.totalCount ?? 0}</p>
          <p className="text-xs text-slate-500 mt-1">Archived snapshots on disk</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Storage Used</p>
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg text-sm">💾</span>
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-3">
            {backupStatus?.totalSizeFormatted ?? "0 MB"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Combined archive size</p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Latest Snapshot</p>
            <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm">✅</span>
          </div>
          <p className="text-lg font-bold text-emerald-400 mt-3">
            {latest ? latest.sizeFormatted : "None"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {latest ? new Date(latest.createdAt).toLocaleString() : "No backup recorded"}
          </p>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Retention Policy</p>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm">⏳</span>
          </div>
          <p className="text-3xl font-extrabold text-purple-400 mt-3">{currentRetention}</p>
          <p className="text-xs text-slate-500 mt-1">Days before auto-prune</p>
        </div>
      </div>

      {/* Retention Policy Editor */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6">
        <h3 className="font-bold text-white text-base mb-1">Retention Policy</h3>
        <p className="text-xs text-slate-400 mb-4">
          Snapshots older than this window are pruned automatically by the backup service.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <input
              type="number"
              min={1}
              max={365}
              value={retentionInput}
              onChange={(e) => setRetentionInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
            />
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">days</span>
          </div>

          <button
            onClick={() => onSetRetention(Number(retentionInput))}
            disabled={isBusy || !retentionInput || Number(retentionInput) === currentRetention}
            className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer"
          >
            Save Policy
          </button>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[3, 7, 14, 30].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  setRetentionInput(String(preset));
                  onSetRetention(preset);
                }}
                disabled={isBusy || preset === currentRetention}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition cursor-pointer disabled:opacity-40 ${
                  preset === currentRetention
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                    : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                {preset}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Archive List */}
      <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Backup Archives</h3>
            <p className="text-xs text-slate-400">{filtered.length} of {backups.length} snapshots</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono w-44"
            />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest" | "largest")}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="largest">Sort: Largest</option>
            </select>
          </div>
        </div>

        {backupStatus?.error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
            Failed to load backups: {backupStatus.error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
            <span className="text-3xl">📭</span>
            <p className="text-slate-400 text-sm mt-2">
              {search ? "No archives match your search" : "No world backups found in storage"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => {
              const { expires, daysLeft } = expiryOf(b.createdAt);
              const isExpiringSoon = daysLeft <= 1;
              return (
                <div
                  key={b.filename}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-950/70 border border-slate-800/70 rounded-xl hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">💾</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-white font-mono truncate">{b.filename}</p>
                        {b.isLatest && (
                          <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-400">
                          {new Date(b.createdAt).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">{b.sizeFormatted}</span>
                        <span
                          className={`text-[11px] font-medium ${
                            daysLeft <= 0 ? "text-rose-400" : isExpiringSoon ? "text-amber-400" : "text-slate-500"
                          }`}
                        >
                          {daysLeft <= 0
                            ? "Expired"
                            : `Expires in ${daysLeft}d (${expires.toLocaleDateString()})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Permanently delete ${b.filename}?\n\nThis cannot be undone.`
                        )
                      ) {
                        onDeleteBackup(b.filename);
                      }
                    }}
                    disabled={isBusy || isBackingUp}
                    title="Delete backup"
                    className="self-start sm:self-auto shrink-0 px-2.5 py-1.5 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition cursor-pointer disabled:opacity-40"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
