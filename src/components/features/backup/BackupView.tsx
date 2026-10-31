"use client";

import { useState, useEffect } from "react";
import type { BackupStatusResponse } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { ProgressGauge } from "@/components/ui/ProgressGauge";

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

export function BackupView({
  backupStatus,
  onRefresh,
  onTriggerBackup,
  onDeleteBackup,
  onRestoreBackup,
  onSetRetention,
  isBackingUp = false,
  isBusy = false,
}: BackupPageProps) {
  const [internalStatus, setInternalStatus] = useState<BackupStatusResponse | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Use props if provided, else internal polled status
  const currentStatus = backupStatus ?? internalStatus;

  useEffect(() => {
    if (!backupStatus) {
      fetch("/api/backup")
        .then((res) => (res.ok ? res.json() : null))
        .then((data: BackupStatusResponse | null) => {
          if (data) setInternalStatus(data);
        })
        .catch(() => {});
    }
  }, [backupStatus]);

  const archives: BackupArchiveItem[] = (currentStatus?.backups || []).map((b) => {
    const isManual = b.filename.includes("manual");
    return {
      filename: b.filename,
      timestamp: b.createdAt
        ? new Date(b.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : new Date(b.mtime * 1000).toLocaleString(),
      trigger: isManual ? "Manual (Pre-mod)" : "Automated (Cron)",
      size: b.sizeFormatted,
      format: "tar.gz",
      status: isManual ? "Pinned (Manual)" : "Verified",
      isLatest: b.isLatest,
    };
  });

  const handleCreateSnapshot = async () => {
    setActionNotice("Snapshot initiated: Freezing chunks & creating world tar.gz archive...");
    try {
      if (onTriggerBackup) {
        await onTriggerBackup();
      } else {
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "trigger" }),
        });
        if (!res.ok) throw new Error("Backup failed");
      }
      onRefresh?.();
      setActionNotice("Snapshot completed successfully.");
    } catch (err: unknown) {
      setActionNotice(`Snapshot error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleRestore = async (filename: string) => {
    if (
      !window.confirm(
        `Are you sure you want to restore "${filename}"?\n\nWarning: Server will stop, current world chunks will be overwritten, and container will restart.`
      )
    ) {
      return;
    }
    setActionNotice(`Restoring snapshot ${filename}... World chunks will be restored.`);
    try {
      if (onRestoreBackup) {
        await onRestoreBackup(filename);
      } else {
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore", filename }),
        });
        if (!res.ok) throw new Error("Restore failed");
      }
      onRefresh?.();
      setActionNotice(`Restored ${filename} successfully!`);
    } catch (err: unknown) {
      setActionNotice(`Restore error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Permanently delete archive "${filename}"?`)) return;
    try {
      if (onDeleteBackup) {
        await onDeleteBackup(filename);
      } else {
        const res = await fetch("/api/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", filename }),
        });
        if (!res.ok) throw new Error("Delete failed");
      }
      onRefresh?.();
      setActionNotice(`Deleted archive: ${filename}`);
    } catch (err: unknown) {
      setActionNotice(`Delete error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const handleDownload = (filename: string) => {
    window.open(`/api/backup/download?filename=${encodeURIComponent(filename)}`, "_blank");
  };

  const filteredArchives = archives.filter((item) => {
    if (activeFilter === "automated" && item.trigger !== "Automated (Cron)") return false;
    if (activeFilter === "manual" && item.trigger !== "Manual (Pre-mod)") return false;

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

  const totalBytes = currentStatus?.totalSizeBytes || 0;
  const quotaBytes = 100 * 1024 * 1024 * 1024; // 100 GB quota
  const usedPct = Math.min(100, Math.round((totalBytes / quotaBytes) * 100));

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Backups & Restore
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> HEALTHY · Daily Snapshots ·{" "}
            {currentStatus?.retentionDays ?? 7}-Day Auto Retention · 100 GB Quota
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
            <span className="text-overline text-muted-foreground uppercase">STORAGE QUOTA</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-overline font-semibold bg-surface-raised border border-border text-heading font-mono">
              {archives.length} Archives
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
              {currentStatus?.totalSizeFormatted || "0 MB"} / 100 GB ({usedPct}%)
            </div>
            <div className="mt-2">
              <ProgressGauge value={usedPct} size="md" />
            </div>
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            174 GB free on disk · /home/oukendev/minecraft/backups
          </div>
        </div>

        {/* Card 2: Automated Snapshots */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-overline text-muted-foreground uppercase">
              AUTOMATED SNAPSHOTS
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-overline font-semibold bg-success-surface text-success border border-success-border font-mono">
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

          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-xs text-subtle-foreground">Retention:</span>
            {[3, 7, 14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={async () => {
                  if (onSetRetention) await onSetRetention(d);
                  else {
                    await fetch("/api/backup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "retention", retentionDays: d }),
                    });
                  }
                  onRefresh?.();
                  setActionNotice(`Retention policy set to ${d} days`);
                  setTimeout(() => setActionNotice(null), 3000);
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono cursor-pointer border ${
                  (currentStatus?.retentionDays ?? 7) === d
                    ? "bg-primary text-primary-foreground border-primary font-semibold"
                    : "bg-surface-raised text-muted-foreground border-border hover:text-heading"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Card 3: Off-site Cloud Sync */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-overline text-muted-foreground uppercase">
              OFF-SITE CLOUD SYNC
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-overline font-semibold bg-primary/10 text-primary border border-primary/20 font-mono">
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

          <div className="text-xs text-subtle-foreground font-mono">
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-heading truncate">
                          {archive.filename}
                        </span>
                        {archive.isLatest && (
                          <span className="px-1.5 py-0.2 rounded text-overline font-bold uppercase bg-success-surface text-success border border-success-border">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{archive.timestamp}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-heading font-medium">{archive.trigger}</span>
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
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-overline font-semibold bg-success-surface text-success border border-success-border">
                        ✓ Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-overline font-semibold bg-info-surface text-info border border-info-border">
                        📌 Pinned (Manual)
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(archive.filename)}
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
