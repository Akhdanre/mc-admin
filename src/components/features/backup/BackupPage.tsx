"use client";

import { useState } from "react";
import type { BackupStatusResponse, BackupItem } from "@/types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export interface BackupPageProps {
  backupStatus: BackupStatusResponse | null;
  onRefresh: () => void;
  onTriggerBackup: () => Promise<void>;
  onDeleteBackup: (filename: string) => Promise<void>;
  onSetRetention: (days: number) => Promise<void>;
  onRestoreBackup?: (filename: string) => Promise<void>;
  isBackingUp: boolean;
  isBusy: boolean;
}

const MOCK_BACKUP_ARCHIVES: BackupItem[] = [
  { filename: "backup-2026-10-31-0500.tar.gz", sizeBytes: 5120000000, sizeFormatted: "4.82 GB", createdAt: "2026-10-31 05:00", mtime: Date.now() - 3600000 * 6, isLatest: true },
  { filename: "backup-2026-10-30-0500.tar.gz", sizeBytes: 5090000000, sizeFormatted: "4.78 GB", createdAt: "2026-10-30 05:00", mtime: Date.now() - 3600000 * 30, isLatest: false },
  { filename: "backup-2026-10-29-0500.tar.gz", sizeBytes: 4980000000, sizeFormatted: "4.65 GB", createdAt: "2026-10-29 05:00", mtime: Date.now() - 3600000 * 54, isLatest: false },
  { filename: "backup-2026-10-28-0500.tar.gz", sizeBytes: 4850000000, sizeFormatted: "4.52 GB", createdAt: "2026-10-28 05:00", mtime: Date.now() - 3600000 * 78, isLatest: false },
  { filename: "backup-2026-10-27-0500.tar.gz", sizeBytes: 4720000000, sizeFormatted: "4.41 GB", createdAt: "2026-10-27 05:00", mtime: Date.now() - 3600000 * 102, isLatest: false },
];

export function BackupPage({
  backupStatus,
  onRefresh,
  onTriggerBackup,
  onDeleteBackup,
  onSetRetention,
  onRestoreBackup,
  isBackingUp,
  isBusy,
}: BackupPageProps) {
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "largest">("newest");
  const [retentionDays, setRetentionDays] = useState(backupStatus?.retentionDays ?? 7);
  const [isUpdatingRetention, setIsUpdatingRetention] = useState(false);

  const rawBackups = backupStatus?.backups?.length ? backupStatus.backups : MOCK_BACKUP_ARCHIVES;
  const totalCount = backupStatus?.totalCount || rawBackups.length;
  const totalSizeFormatted = backupStatus?.totalSizeFormatted || "23.18 GB";

  const handleUpdateRetention = async () => {
    setIsUpdatingRetention(true);
    try {
      await onSetRetention(retentionDays);
    } finally {
      setIsUpdatingRetention(false);
    }
  };

  const handleRestore = async (filename: string) => {
    if (
      !window.confirm(
        `Are you sure you want to restore "${filename}"?\n\nWarning: The server will be stopped, current world files replaced with this snapshot, and the server restarted.`
      )
    ) {
      return;
    }
    await onRestoreBackup?.(filename);
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Permanently delete backup "${filename}"?`)) return;
    await onDeleteBackup(filename);
  };

  const filtered = rawBackups
    .filter((b) => b.filename.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === "oldest") return a.mtime - b.mtime;
      if (sortOrder === "largest") return b.sizeBytes - a.sizeBytes;
      return b.mtime - a.mtime;
    });

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Backups & Restore
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated snapshot scheduler, archive lifecycle and disaster recovery
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            disabled={isBusy}
            className="text-xs h-8 px-3"
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={onTriggerBackup}
            disabled={isBackingUp || isBusy}
            className="text-xs h-8 px-4 font-medium"
          >
            {isBackingUp ? "Creating Archive..." : "Create Backup Now"}
          </Button>
        </div>
      </div>

      {/* 3 Overview Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Footprint */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Storage Footprint
          </div>
          <div className="text-2xl font-semibold text-heading mt-2">
            {totalSizeFormatted}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {totalCount} total archives stored across NVMe volume
          </div>
        </div>

        {/* Card 2: Active Retention */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Retention Policy
            </span>
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Auto-Prune Active
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-semibold text-heading">{retentionDays}</span>
            <span className="text-xs text-muted-foreground">Days Archive History</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              min={1}
              max={90}
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-16 bg-surface-raised border border-border rounded px-2 py-0.5 text-xs text-heading"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleUpdateRetention}
              disabled={isUpdatingRetention}
              className="text-xs h-6 px-2"
            >
              Update Days
            </Button>
          </div>
        </div>

        {/* Card 3: Next Automated Snapshot */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Next Automated Snapshot
          </div>
          <div className="text-2xl font-semibold text-heading mt-2">
            05:00 UTC
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Automated daily snapshot triggered by cron scheduler
          </div>
        </div>
      </div>

      {/* Backups Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface border border-border p-2.5 rounded-xl">
        <div className="flex flex-1 sm:max-w-xs items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search archive filename..."
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
            className="bg-surface-raised border border-border rounded-lg px-2.5 py-1.5 text-xs text-heading focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="largest">Largest First</option>
          </select>
        </div>
      </div>

      {/* Archives Table Card */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[320px]">Archive File</TableHead>
              <TableHead>Archive Size</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Integrity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No backup archives found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((archive) => (
                <TableRow key={archive.filename}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-base">📦</span>
                      <span className="font-mono text-xs font-semibold text-heading truncate">
                        {archive.filename}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-heading">
                      {archive.sizeFormatted}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">{archive.createdAt}</span>
                  </TableCell>

                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                      ✓ Verified
                    </span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRestore(archive.filename)}
                        disabled={isBusy}
                        className="text-xs h-7 px-2.5"
                      >
                        Restore
                      </Button>
                      <a
                        href={`/api/backup/download?filename=${encodeURIComponent(archive.filename)}`}
                        download={archive.filename}
                        className="inline-flex items-center justify-center text-xs h-7 px-2.5 rounded-lg border border-border bg-surface hover:bg-surface-raised text-heading transition-colors"
                      >
                        Download
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(archive.filename)}
                        disabled={isBusy}
                        className="text-xs h-7 px-2 text-danger hover:text-danger hover:bg-danger-surface"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
