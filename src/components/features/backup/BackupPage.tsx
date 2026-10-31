"use client";

import { useState } from "react";
import type { BackupStatusResponse } from "@/types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ProgressGauge } from "@/components/ui/ProgressGauge";
import { cn } from "@/lib/cn";

export interface BackupPageProps {
  backupStatus?: BackupStatusResponse | null;
  onRefresh?: () => void;
  onTriggerBackup?: () => Promise<void>;
  onDeleteBackup?: (filename: string) => Promise<void>;
  onSetRetention?: (days: number) => Promise<void>;
  onRestoreBackup?: (filename: string) => Promise<void>;
  isBackingUp?: boolean;
  isBusy?: boolean;
}

interface BackupArchiveItem {
  filename: string;
  timestamp: string;
  trigger: "Automated (Cron)" | "Manual (Pre-mod)";
  size: string;
  format: string;
  status: "Verified" | "Pinned (Manual)";
  isLatest?: boolean;
}

const PENPOT_ARCHIVES: BackupArchiveItem[] = [
  {
    filename: "world-backup-20261030-050001.tar.gz",
    timestamp: "Today at 05:03 UTC · Latest",
    trigger: "Automated (Cron)",
    size: "3.9 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
    isLatest: true,
  },
  {
    filename: "world-backup-20261029-050001.tar.gz",
    timestamp: "Yesterday at 05:03 UTC",
    trigger: "Automated (Cron)",
    size: "3.6 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
  {
    filename: "world-backup-20261028-164000.tar.gz",
    timestamp: "28 Oct 2026, 16:40 UTC · Pre-Cataclysm",
    trigger: "Manual (Pre-mod)",
    size: "3.0 GB",
    format: "tar.gz (gzip)",
    status: "Pinned (Manual)",
  },
  {
    filename: "world-backup-20261028-050001.tar.gz",
    timestamp: "28 Oct 2026, 05:02 UTC",
    trigger: "Automated (Cron)",
    size: "3.0 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
  {
    filename: "world-backup-20261027-050001.tar.gz",
    timestamp: "27 Oct 2026, 05:02 UTC",
    trigger: "Automated (Cron)",
    size: "2.9 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
  {
    filename: "world-backup-20261026-050001.tar.gz",
    timestamp: "26 Oct 2026, 05:02 UTC",
    trigger: "Automated (Cron)",
    size: "2.9 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
  {
    filename: "world-backup-20261025-050001.tar.gz",
    timestamp: "25 Oct 2026, 05:02 UTC",
    trigger: "Automated (Cron)",
    size: "2.9 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
  {
    filename: "world-backup-20261024-050001.tar.gz",
    timestamp: "24 Oct 2026, 05:02 UTC",
    trigger: "Automated (Cron)",
    size: "2.8 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
  {
    filename: "world-backup-20261023-050001.tar.gz",
    timestamp: "23 Oct 2026, 05:02 UTC",
    trigger: "Automated (Cron)",
    size: "2.8 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
  {
    filename: "world-backup-20261022-050001.tar.gz",
    timestamp: "22 Oct 2026, 05:02 UTC",
    trigger: "Automated (Cron)",
    size: "2.8 GB",
    format: "tar.gz (gzip)",
    status: "Verified",
  },
];

export function BackupPage({
  onRefresh,
  onTriggerBackup,
  onDeleteBackup,
  onRestoreBackup,
  isBackingUp = false,
  isBusy = false,
}: BackupPageProps) {
  const [archives, setArchives] = useState<BackupArchiveItem[]>(PENPOT_ARCHIVES);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleCreateSnapshot = async () => {
    if (onTriggerBackup) {
      await onTriggerBackup();
    }
    setActionNotice("Snapshot initiated: Creating world gzip archive...");
    setTimeout(() => {
      setActionNotice("Snapshot completed successfully.");
      setTimeout(() => setActionNotice(null), 3000);
    }, 2000);
  };

  const handleRestore = async (filename: string) => {
    if (
      !window.confirm(
        `Are you sure you want to restore "${filename}"?\n\nWarning: Server will stop, current world chunks will be overwritten, and container will restart.`
      )
    ) {
      return;
    }
    if (onRestoreBackup) {
      await onRestoreBackup(filename);
    }
    setActionNotice(`Restoring snapshot ${filename}... Server restarting.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Permanently delete archive "${filename}"?`)) return;
    if (onDeleteBackup) {
      await onDeleteBackup(filename);
    }
    setArchives((prev) => prev.filter((a) => a.filename !== filename));
    setActionNotice(`Deleted archive: ${filename}`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredArchives = archives.filter((item) => {
    // Filter by category segment
    if (activeFilter === "automated" && item.trigger !== "Automated (Cron)") return false;
    if (activeFilter === "manual" && item.trigger !== "Manual (Pre-mod)") return false;

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.filename.toLowerCase().includes(q) ||
        item.timestamp.toLowerCase().includes(q) ||
        item.trigger.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const automatedCount = archives.filter((a) => a.trigger === "Automated (Cron)").length;
  const manualCount = archives.filter((a) => a.trigger === "Manual (Pre-mod)").length;

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-subtle-foreground hover:text-foreground cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Backups & Restore
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-emerald-500 font-bold">●</span> HEALTHY · Daily Snapshots · 7-Day Auto Retention · 174 GB Disk Free
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setActionNotice("Syncing with Wasabi S3 bucket...");
              setTimeout(() => setActionNotice("S3 bucket mirroring verified."), 2000);
            }}
            className="text-xs h-8 px-3"
          >
            S3 Off-Site Sync
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleCreateSnapshot}
            disabled={isBackingUp || isBusy}
            className="text-xs h-8 px-4 font-medium"
          >
            {isBackingUp ? "Creating Archive..." : "Create Snapshot Now"}
          </Button>
        </div>
      </div>

      {/* Backup Overview Cards Row (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Storage Quota */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              STORAGE QUOTA
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-raised border border-border text-heading font-mono">
              {archives.length} Archives
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
              31.0 GB / 100 GB (31%)
            </div>
            <div className="mt-2">
              <ProgressGauge value={31} size="md" />
            </div>
          </div>

          <div className="text-[11px] text-muted-foreground font-mono">
            174 GB free on disk · /home/oukendev/minecraft/backups
          </div>
        </div>

        {/* Card 2: Automated Snapshots */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              AUTOMATED SNAPSHOTS
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
              ● Daily Enabled
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
              05:00 UTC (Daily)
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Runs daily every 24 hours · Next run in 18h (05:00 UTC)
            </div>
          </div>

          <div className="text-[11px] text-subtle-foreground">
            Retention rule: Backups older than 7 days will be deleted
          </div>
        </div>

        {/* Card 3: Off-site Cloud Sync */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              OFF-SITE CLOUD SYNC
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-mono">
              ● S3 Wasabi
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
              Synced (3.9 GB Latest)
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Bucket: mc-pulse-backups · Region: ap-southeast-1
            </div>
          </div>

          <div className="text-[11px] text-subtle-foreground font-mono">
            Last mirrored: Today at 05:14 UTC (SHA-256 Verified)
          </div>
        </div>
      </div>

      {/* Backups Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-surface border border-border p-2.5 rounded-xl">
        <SegmentedControl
          size="sm"
          value={activeFilter}
          onChange={(val) => setActiveFilter(val)}
          options={[
            { value: "all", label: "All Archives", badge: archives.length },
            { value: "automated", label: "Automated", badge: automatedCount },
            { value: "manual", label: "Manual Pre-Mod", badge: manualCount },
          ]}
        />

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter tanggal atau nama file..."
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Archives Table Card */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[340px]">ARCHIVE ARTIFACT & TIMESTAMP</TableHead>
              <TableHead>TRIGGER & SCOPE</TableHead>
              <TableHead>FILE SIZE</TableHead>
              <TableHead>FORMAT</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArchives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No backup archives found matching filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredArchives.map((archive) => (
                <TableRow key={archive.filename}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg shrink-0">📦</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-heading truncate">
                            {archive.filename}
                          </span>
                          {archive.isLatest && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Latest
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {archive.timestamp}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-heading font-medium">
                      {archive.trigger}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs font-medium text-heading">
                      {archive.size}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {archive.format}
                    </span>
                  </TableCell>

                  <TableCell>
                    {archive.status === "Verified" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        📌 Pinned (Manual)
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActionNotice(`Downloading archive ${archive.filename}...`);
                          setTimeout(() => setActionNotice(null), 2500);
                        }}
                        className="text-xs h-7 px-2.5"
                      >
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(archive.filename)}
                        className="text-xs h-7 px-2.5 text-warning hover:text-warning"
                      >
                        Restore...
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(archive.filename)}
                        className="text-xs h-7 w-7 p-0 text-muted-foreground hover:text-danger"
                        title="Delete archive"
                      >
                        🗑️
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
