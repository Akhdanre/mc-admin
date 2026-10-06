"use client";

import { useState, useSyncExternalStore } from "react";
import type { BackupStatusResponse } from "@/types";

import { Badge, Button, Card, CardLabel, Input, Select } from "@/components/ui";

// Ticking clock exposed as an external store so render can read the current
// time without calling the impure Date.now() during render. The snapshot is
// cached and only advances on each subscribe tick, keeping getSnapshot stable
// between ticks (required by useSyncExternalStore).
let nowSnapshot = Date.now();
function subscribeNow(onTick: () => void) {
  const id = setInterval(() => {
    nowSnapshot = Date.now();
    onTick();
  }, 1000);
  return () => clearInterval(id);
}
function getNowSnapshot() {
  return nowSnapshot;
}
function getServerNowSnapshot() {
  return nowSnapshot;
}

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
  // Current time read from an external ticking store — render stays pure.
  const now = useSyncExternalStore(subscribeNow, getNowSnapshot, getServerNowSnapshot);

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
    const daysLeft = Math.ceil((expires.getTime() - now) / 86400000);
    return { expires, daysLeft };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card padding="lg" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge tone="success" className="mb-2">
            <span>World Snapshot &amp; Retention Control</span>
          </Badge>
          <h2 className="text-xl font-bold text-white tracking-tight">Backup Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Trigger archives, prune old snapshots, and configure the automatic retention policy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={onRefresh}
            disabled={isBusy || isBackingUp}
            className="px-3 py-2 text-xs"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={onTriggerBackup}
            disabled={isBackingUp || isBusy}
            className="px-4 py-2 text-xs font-semibold"
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
          </Button>
        </div>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Total Backups</CardLabel>
            <span className="p-2 bg-indigo-500/10 text-primary-muted rounded-lg text-sm">🗃️</span>
          </div>
          <p className="text-3xl font-extrabold text-white mt-3">{backupStatus?.totalCount ?? 0}</p>
          <p className="text-xs text-subtle-foreground mt-1">Archived snapshots on disk</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Storage Used</CardLabel>
            <span className="p-2 bg-amber-500/10 text-warning-muted rounded-lg text-sm">💾</span>
          </div>
          <p className="text-3xl font-extrabold text-warning-muted mt-3">
            {backupStatus?.totalSizeFormatted ?? "0 MB"}
          </p>
          <p className="text-xs text-subtle-foreground mt-1">Combined archive size</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Latest Snapshot</CardLabel>
            <span className="p-2 bg-emerald-500/10 text-success-muted rounded-lg text-sm">✅</span>
          </div>
          <p className="text-lg font-bold text-success-muted mt-3">
            {latest ? latest.sizeFormatted : "None"}
          </p>
          <p className="text-xs text-subtle-foreground mt-1">
            {latest ? new Date(latest.createdAt).toLocaleString() : "No backup recorded"}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardLabel>Retention Policy</CardLabel>
            <span className="p-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm">⏳</span>
          </div>
          <p className="text-3xl font-extrabold text-purple-400 mt-3">{currentRetention}</p>
          <p className="text-xs text-subtle-foreground mt-1">Days before auto-prune</p>
        </Card>
      </div>

      {/* Retention Policy Editor */}
      <Card padding="lg">
        <h3 className="font-bold text-white text-base mb-1">Retention Policy</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Snapshots older than this window are pruned automatically by the backup service.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <Input
              type="number"
              min={1}
              max={365}
              value={retentionInput}
              onChange={(e) => setRetentionInput(e.target.value)}
              mono
              className="w-full"
            />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">days</span>
          </div>

          <Button
            variant="primary"
            onClick={() => onSetRetention(Number(retentionInput))}
            disabled={isBusy || !retentionInput || Number(retentionInput) === currentRetention}
            className="px-4 py-2 text-xs font-semibold"
          >
            Save Policy
          </Button>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[3, 7, 14, 30].map((preset) => (
              <Button
                key={preset}
                variant={preset === currentRetention ? "primary" : "secondary"}
                onClick={() => {
                  setRetentionInput(String(preset));
                  onSetRetention(preset);
                }}
                disabled={isBusy || preset === currentRetention}
                className="px-2.5 py-1 text-[11px] font-medium"
              >
                {preset}d
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Archive List */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Backup Archives</h3>
            <p className="text-xs text-muted-foreground">{filtered.length} of {backups.length} snapshots</p>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search filename..."
              mono
              className="w-44 px-3 py-1.5"
            />
            <Select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest" | "largest")}
              className="px-2.5 py-1.5"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="largest">Sort: Largest</option>
            </Select>
          </div>
        </div>

        {backupStatus?.error ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-danger-muted rounded-xl text-xs font-mono">
            Failed to load backups: {backupStatus.error}
          </div>
        ) : filtered.length === 0 ? (
          <Card tone="muted" className="text-center py-10">
            <span className="text-3xl">📭</span>
            <p className="text-muted-foreground text-sm mt-2">
              {search ? "No archives match your search" : "No world backups found in storage"}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => {
              const { expires, daysLeft } = expiryOf(b.createdAt);
              const isExpiringSoon = daysLeft <= 1;
              return (
                <Card
                  key={b.filename}
                  tone="solid"
                  padding="sm"
                  className="bg-background/70 border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border-strong transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">💾</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-semibold text-white font-mono truncate">{b.filename}</p>
                        {b.isLatest && (
                          <Badge tone="success" className="px-1.5 py-0.5 text-[9px] uppercase tracking-wider rounded">
                            Latest
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(b.createdAt).toLocaleString()}
                        </span>
                        <span className="text-[11px] text-subtle-foreground font-mono">{b.sizeFormatted}</span>
                        <span
                          className={`text-[11px] font-medium ${
                            daysLeft <= 0 ? "text-danger-muted" : isExpiringSoon ? "text-warning-muted" : "text-subtle-foreground"
                          }`}
                        >
                          {daysLeft <= 0
                            ? "Expired"
                            : `Expires in ${daysLeft}d (${expires.toLocaleDateString()})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="danger"
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
                    className="self-start sm:self-auto shrink-0 px-2.5 py-1.5 text-xs"
                  >
                    Delete
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
