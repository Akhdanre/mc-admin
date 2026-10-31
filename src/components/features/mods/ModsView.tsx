"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
function formatModSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toggle } from "@/components/ui/Toggle";
import { Dropzone } from "@/components/ui/Dropzone";
import { cn } from "@/lib/cn";
import { MOCK_MODS } from "@/lib/mockData";
import type { ModInfo, ModItem } from "@/types";
export interface ModsViewProps {
  onShowFeedback?: (message: string, isError?: boolean) => void;
}

export function ModsView({ onShowFeedback }: ModsViewProps) {
  const [mods, setMods] = useState<ModItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [stagedCount, setStagedCount] = useState(0);

  const fetchMods = () => {
    setIsLoading(true);
    fetch("/api/mods")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.mods && data.mods.length > 0) {
          const mapped: ModItem[] = data.mods.map((m: ModInfo) => ({
            id: m.id || m.fileName,
            name: m.name,
            fileName: m.fileName,
            version: m.version || "1.0.0",
            sizeFormatted: formatModSize(m.sizeBytes),
            type: m.loader === "forge" ? "forge" : "plugin",
            enabled: m.enabled,
            author: m.loader === "forge" ? "Forge" : "Server",
            description: m.description || "Server extension jar",
          }));
          setMods(mapped);
        } else {
          setMods(MOCK_MODS);
        }
      })
      .catch(() => {
        setMods(MOCK_MODS);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let mounted = true;
    fetch("/api/mods")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted) return;
        if (data?.mods && data.mods.length > 0) {
          const mapped: ModItem[] = data.mods.map((m: ModInfo) => ({
            id: m.id || m.fileName,
            name: m.name,
            fileName: m.fileName,
            version: m.version || "1.0.0",
            sizeFormatted: formatModSize(m.sizeBytes),
            type: m.loader === "forge" ? "forge" : "plugin",
            enabled: m.enabled,
            author: m.loader === "forge" ? "Forge" : "Server",
            description: m.description || "Server extension jar",
          }));
          setMods(mapped);
        } else {
          setMods(MOCK_MODS);
        }
      })
      .catch(() => {
        if (mounted) setMods(MOCK_MODS);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const handleToggle = async (mod: ModItem) => {
    const nextState = !mod.enabled;
    setMods((prev) => prev.map((m) => (m.id === mod.id ? { ...m, enabled: nextState } : m)));
    setStagedCount((c) => c + 1);
    try {
      await fetch("/api/mods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: mod.fileName, enabled: nextState }),
      });
      onShowFeedback?.(
        `${mod.name} ${nextState ? "enabled" : "disabled"}. Server restart required.`
      );
    } catch {
      onShowFeedback?.(`${mod.name} ${nextState ? "enabled" : "disabled"} (offline preview)`);
    }
  };

  const handleDelete = async (mod: ModItem) => {
    if (!window.confirm(`Delete "${mod.fileName}"? This cannot be undone.`)) return;
    setMods((prev) => prev.filter((m) => m.id !== mod.id));
    try {
      await fetch(`/api/mods?fileName=${encodeURIComponent(mod.fileName)}`, {
        method: "DELETE",
      });
      onShowFeedback?.(`Removed ${mod.name}`);
    } catch {
      onShowFeedback?.(`Removed ${mod.name} (offline preview)`);
    }
  };

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/mods", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const newMod: ModItem = {
          id: `mod-upload-${Date.now()}-${file.name}`,
          name: file.name.replace(/\.jar$/i, ""),
          fileName: file.name,
          version: "Latest",
          sizeFormatted: formatModSize(file.size),
          type: "forge",
          enabled: true,
          author: "Uploaded",
          description: "Uploaded Forge extension archive",
        };
        setMods((prev) => [newMod, ...prev]);
        setStagedCount((c) => c + 1);
      }
      onShowFeedback?.(`Uploaded ${files.length} mod(s) successfully! Restart required.`);
    } catch (err: unknown) {
      onShowFeedback?.(
        `Failed to upload: ${err instanceof Error ? err.message : String(err)}`,
        true
      );
    } finally {
      setIsUploading(false);
    }
  };

  const filteredMods = mods.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.fileName.toLowerCase().includes(search.toLowerCase()) ||
      m.author.toLowerCase().includes(search.toLowerCase());

    let matchesFilter = true;
    if (typeFilter === "active") matchesFilter = m.enabled;
    else if (typeFilter === "disabled") matchesFilter = !m.enabled;

    return matchesSearch && matchesFilter;
  });

  const activeCount = mods.filter((m) => m.enabled).length;
  const disabledCount = mods.filter((m) => !m.enabled).length;
  const totalMb = mods.reduce((sum, m) => {
    const val = parseFloat(m.sizeFormatted);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Mods & Addons
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> ONLINE ·{" "}
            {isLoading ? "Scanning..." : `${mods.length} Installed Mods (${totalMb.toFixed(0)} MB)`}{" "}
            · Forge 47.3.0 · Minecraft 1.20.1
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stagedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-warning-surface text-warning border border-warning-border">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z" />
                  <path
                    fillRule="evenodd"
                    d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A4.985 4.985 0 0 1 8 2c2.76 0 5 2.24 5 5a.5.5 0 0 1-1 0c0-2.21-1.79-4-4-4zm-4.992 8.5a.5.5 0 0 1 .5.5c0 2.21 1.79 4 4 4 1.552 0 2.94-.707 3.857-1.818a.5.5 0 1 1 .771.636A4.985 4.985 0 0 1 8 16c-2.76 0-5-2.24-5-5a.5.5 0 0 1 .5-.5z"
                  />
                </svg>
                <span>{stagedCount} Staged (/restart)</span>
              </span>
            </span>
          )}
          <Button size="sm" variant="outline" onClick={fetchMods} className="text-xs h-8 px-3">
            ↻ Refresh
          </Button>
        </div>
      </div>

      {/* Dropzone Quick Intake */}
      <Dropzone
        onFilesSelected={handleFilesSelected}
        accept=".jar"
        multiple
        title="Drag and drop .jar mod files here to install, or click to browse from computer (Max 250 MB per JAR)"
        subtitle="Automatic deployment to server mods directory"
        disabled={isUploading}
      />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface border border-border p-2.5 rounded-xl">
        <div className="flex flex-1 sm:max-w-xs items-center">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search installed plugins or dependencies..."
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <SegmentedControl
          size="sm"
          value={typeFilter}
          onChange={(val) => setTypeFilter(val)}
          options={[
            { value: "all", label: "All Mods", badge: mods.length },
            { value: "active", label: "Active", badge: activeCount },
            { value: "disabled", label: "Disabled", badge: disabledCount },
            { value: "updates", label: "Updates Ready", badge: 0 },
          ]}
        />
      </div>

      {/* Mods Table Card / Empty State */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        {filteredMods.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-muted-foreground mx-auto mb-3">
              <svg
                className="w-6 h-6 text-muted-foreground"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M3.112 5.112a3.145 3.145 0 0 1-.211-.396A3.026 3.026 0 0 1 2.5 3.564 3.076 3.076 0 0 1 3.564 2.5a3.026 3.026 0 0 1 1.152-.401c.133-.021.266-.032.396-.211A1.5 1.5 0 0 1 6.5 2.5h3A1.5 1.5 0 0 1 11 1.888c.13.179.263.19.396.211.393.062.779.2 1.152.401.373.202.71.468 1.064.952.355.485.49 1.026.401 1.152a1.5 1.5 0 0 1-.613 1.396V9.5a1.5 1.5 0 0 1 .613 1.396c.089.126-.046.667-.401 1.152-.354.484-.691.75-1.064.952-.373.201-.759.339-1.152.401-.133.021-.266.032-.396.211A1.5 1.5 0 0 1 9.5 14.5h-3a1.5 1.5 0 0 1-1.5-.612c-.13-.179-.263-.19-.396-.211a3.026 3.026 0 0 1-1.152-.401 3.076 3.076 0 0 1-.952-1.064 3.026 3.026 0 0 1-.401-1.152A1.5 1.5 0 0 1 1.5 9.5V6.5a1.5 1.5 0 0 1 .612-1.388zm6.388 7.388a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V11a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5H11a.5.5 0 0 1-.5-.5V7a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 0 .5-.5v-.5a.5.5 0 0 0-.5-.5H11a.5.5 0 0 1-.5-.5V3a.5.5 0 0 0-.5-.5h-.5a.5.5 0 0 0-.5.5V4.5a.5.5 0 0 1-.5.5H7a.5.5 0 0 1-.5-.5V3a.5.5 0 0 0-.5-.5h-.5a.5.5 0 0 0-.5.5V4.5a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5H5a.5.5 0 0 1 .5.5V8.5a.5.5 0 0 1-.5.5H3.5a.5.5 0 0 0-.5.5v.5a.5.5 0 0 0 .5.5H5a.5.5 0 0 1 .5.5V12a.5.5 0 0 0 .5.5h.5a.5.5 0 0 0 .5-.5V10.5a.5.5 0 0 1 .5-.5H8a.5.5 0 0 1 .5.5v1.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-heading">No plugins or mods found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Drag and drop .jar files into the dropzone above to install new extensions.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[280px]">Plugin / Extension</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>File Size</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMods.map((mod) => (
                <TableRow key={mod.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-heading flex items-center gap-2">
                        <span>{mod.name}</span>
                        <span className="text-overline font-mono px-1 py-0.2 rounded bg-surface-raised border border-border text-subtle-foreground uppercase">
                          {mod.type}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-xs mt-0.5">
                        {mod.description}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-heading font-medium">
                      v{mod.version}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      {mod.sizeFormatted}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-subtle-foreground">{mod.author}</span>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Toggle checked={mod.enabled} onChange={() => handleToggle(mod)} />
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-overline font-semibold border uppercase",
                          mod.enabled
                            ? "bg-success-surface text-success border-success-border"
                            : "bg-surface-raised text-muted-foreground border-border"
                        )}
                      >
                        {mod.enabled ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(mod)}
                      className="text-xs h-7 px-2 text-danger hover:text-danger hover:bg-danger-surface"
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
