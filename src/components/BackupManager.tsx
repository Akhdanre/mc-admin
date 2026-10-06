"use client";

import { useState } from "react";
import type { BackupStatusResponse } from "@/types";

interface BackupManagerProps {
  backupStatus: BackupStatusResponse | null;
  onRefresh: () => void;
  onTriggerBackup: () => Promise<void>;
  isBackingUp: boolean;
}

export function BackupManager({
  backupStatus,
  onRefresh,
  onTriggerBackup,
  isBackingUp,
}: BackupManagerProps) {
  const [showAll, setShowAll] = useState(false);

  const backups = backupStatus?.backups || [];
  const displayedBackups = showAll ? backups : backups.slice(0, 5);
  const latest = backupStatus?.latestBackup;

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <span>Automated World Snapshots</span>
          </div>
          <h3 className="font-bold text-white text-lg">Backup Management</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            World archives are stored safely on the host with a {backupStatus?.retentionDays ?? 7}-day retention policy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isBackingUp}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-xl transition border border-slate-700 cursor-pointer"
          >
            Refresh
          </button>
          <button
            onClick={onTriggerBackup}
            disabled={isBackingUp}
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
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

      {/* Snapshot Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Backups</span>
          <p className="text-xl font-bold text-white mt-1">{backupStatus?.totalCount ?? 0}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total size: {backupStatus?.totalSizeFormatted ?? "0 MB"}</p>
        </div>

        <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Latest Snapshot</span>
          <p className="text-xl font-bold text-emerald-400 mt-1">
            {latest ? latest.sizeFormatted : "None"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5 truncate" title={latest?.filename}>
            {latest ? new Date(latest.createdAt).toLocaleString() : "No backup recorded"}
          </p>
        </div>

        <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Retention Policy</span>
          <p className="text-xl font-bold text-indigo-400 mt-1">{backupStatus?.retentionDays ?? 7} Days</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Auto-prunes expired archives</p>
        </div>
      </div>

      {/* Backup Archives List */}
      {backupStatus?.error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-mono">
          Failed to load backups: {backupStatus.error}
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-slate-800 rounded-xl">
          <p className="text-slate-400 text-xs">No world backups found in storage.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayedBackups.map((b) => (
            <div
              key={b.filename}
              className="flex items-center justify-between p-3 bg-slate-950/70 border border-slate-800/70 rounded-xl hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">💾</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white font-mono truncate">{b.filename}</p>
                    {b.isLatest && (
                      <span className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                        Latest
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(b.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-slate-200 font-mono">{b.sizeFormatted}</span>
              </div>
            </div>
          ))}

          {backups.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer mt-2"
            >
              {showAll ? "Show Fewer Backups" : `View All ${backups.length} Backups`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
