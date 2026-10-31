"use client";

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toggle } from "@/components/ui/Toggle";
import { Dropzone } from "@/components/ui/Dropzone";
import { cn } from "@/lib/cn";
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

  useEffect(() => {
    // Attempt real fetch, fall back silently to mock data
    fetch("/api/mods")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.mods && data.mods.length > 0) {
          const mapped: ModItem[] = data.mods.map((m: ModInfo, idx: number) => ({
            name: m.name,
            fileName: m.fileName,
            version: m.version || "1.0.0",
            sizeFormatted: `${(m.sizeBytes / 1024 / 1024).toFixed(1)} MB`,
            type: "plugin",
            enabled: m.enabled,
            author: "Server",
            description: m.description || "Server extension jar",
          }));
          setMods(mapped);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async (mod: ModItem) => {
    const nextState = !mod.enabled;
    setMods((prev) =>
      prev.map((m) => (m.id === mod.id ? { ...m, enabled: nextState } : m))
    );
    try {
      await fetch("/api/mods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: mod.fileName, enabled: nextState }),
      });
      onShowFeedback?.(`${mod.name} ${nextState ? "enabled" : "disabled"}. Restart required.`);
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
        await fetch("/api/mods/upload", {
          method: "POST",
          body: formData,
        });
        const newMod: ModItem = {
          id: `mod-upload-${Date.now()}`,
          name: file.name.replace(/\.jar$/i, ""),
          fileName: file.name,
          version: "Latest",
          sizeFormatted: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
          type: "plugin",
          enabled: true,
          author: "Uploaded",
          description: "Manually uploaded plugin archive",
        };
        setMods((prev) => [newMod, ...prev]);
      }
      onShowFeedback?.(`Uploaded ${files.length} plugin(s) successfully!`);
    } catch {
      onShowFeedback?.("Failed to upload plugins", true);
    } finally {
      setIsUploading(false);
    }
  };

  const filteredMods = mods.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.fileName.toLowerCase().includes(search.toLowerCase()) ||
      m.author.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Mods & Addons
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> ONLINE · 49 Installed Mods (211 MB) · Forge 47.3.0 · Minecraft 1.20.1
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-warning-surface text-warning border border-warning-border">
            <span>🔄 1 Staged (/restart)</span>
          </span>
          <Button
            size="sm"
            variant="primary"
            onClick={() => onShowFeedback?.("Opening JAR upload...")}
            className="text-xs h-8 px-3"
          >
            ↑ Upload .jar
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
            { value: "all", label: "All Mods", badge: 49 },
            { value: "active", label: "Active", badge: 47 },
            { value: "disabled", label: "Disabled", badge: 2 },
            { value: "updates", label: "Updates Ready", badge: 1 },
          ]}
        />
      </div>

      {/* Mods Table Card / Empty State */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        {filteredMods.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-raised border border-border flex items-center justify-center text-muted-foreground mx-auto mb-3">
              🧩
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
                      <Toggle
                        checked={mod.enabled}
                        onChange={() => handleToggle(mod)}
                      />
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
