"use client";

import { useState, useEffect } from "react";
import { Badge, Button, Card, Input, Muted, SectionTitle } from "@/components/ui";
import type { ModInfo, ModrinthSearchResult } from "@/types";

interface ModManagerProps {
  onShowFeedback?: (message: string, isError?: boolean) => void;
}

export function ModManager({ onShowFeedback }: ModManagerProps) {
  const [mods, setMods] = useState<ModInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<"installed" | "search">("installed");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ModrinthSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [installingProject, setInstallingProject] = useState<string | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [pendingRestart, setPendingRestart] = useState(false);

  const loadMods = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/mods");
      const data = await res.json();
      if (data.mods) {
        setMods(data.mods);
      }
    } catch {
      onShowFeedback?.("Failed to fetch installed mods", true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMods();
  }, []);

  const handleToggle = async (mod: ModInfo) => {
    try {
      const res = await fetch("/api/mods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: mod.fileName, enabled: !mod.enabled }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to toggle mod");
      }
      setPendingRestart(true);
      onShowFeedback?.(`${mod.name} ${mod.enabled ? "disabled" : "enabled"}`);
      loadMods();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error toggling mod";
      onShowFeedback?.(msg, true);
    }
  };

  const handleDelete = async (fileName: string, name: string) => {
    if (!confirm(`Delete mod "${name}" (${fileName})?`)) return;
    try {
      const res = await fetch(`/api/mods?fileName=${encodeURIComponent(fileName)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete mod");
      }
      setPendingRestart(true);
      onShowFeedback?.(`Deleted ${name}`);
      loadMods();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error deleting mod";
      onShowFeedback?.(msg, true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".jar")) {
      onShowFeedback?.("Only .jar mod files are supported", true);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/mods", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload mod");
      }

      setPendingRestart(true);
      onShowFeedback?.(`Uploaded ${file.name}`);
      e.target.value = "";
      loadMods();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload error";
      onShowFeedback?.(msg, true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearchModrinth = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch(`/api/mods/search?query=${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.hits) {
        setSearchResults(data.hits);
      } else {
        setSearchResults([]);
      }
    } catch {
      onShowFeedback?.("Failed to search Modrinth", true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInstallFromModrinth = async (project: ModrinthSearchResult) => {
    try {
      setInstallingProject(project.project_id);
      const vRes = await fetch(`/api/mods/versions/${project.project_id}`);
      const vData = await vRes.json();

      if (!vData.versions || vData.versions.length === 0) {
        throw new Error("No compatible release found");
      }

      const primaryVersion = vData.versions[0];
      const primaryFile = primaryVersion.files?.find((f: { primary?: boolean; filename?: string }) => f.primary) || primaryVersion.files?.[0];

      if (!primaryFile || !primaryFile.url) {
        throw new Error("No download URL found for this mod version");
      }

      const res = await fetch("/api/mods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downloadUrl: primaryFile.url,
          fileName: primaryFile.filename,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to install mod");
      }

      setPendingRestart(true);
      onShowFeedback?.(`Installed ${project.title}`);
      loadMods();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Install error";
      onShowFeedback?.(msg, true);
    } finally {
      setInstallingProject(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner for Server Restart */}
      {pendingRestart && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Server restart recommended</p>
              <Muted className="text-xs text-amber-200/80">
                Mods have been added, removed, or toggled. Restart Minecraft server for changes to apply.
              </Muted>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setPendingRestart(false)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Subtab selection & controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeSubTab === "installed" ? "primary" : "ghost"}
            onClick={() => setActiveSubTab("installed")}
          >
            Installed ({mods.length})
          </Button>
          <Button
            size="sm"
            variant={activeSubTab === "search" ? "primary" : "ghost"}
            onClick={() => setActiveSubTab("search")}
          >
            Modrinth Store
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".jar"
              className="hidden"
              disabled={isUploading}
              onChange={handleFileUpload}
            />
            <span className="inline-flex items-center justify-center font-medium transition-colors border shadow-xs h-9 px-3 text-sm rounded-xl bg-surface hover:bg-surface-elevated text-foreground border-border">
              {isUploading ? "Uploading..." : "Upload .jar"}
            </span>
          </label>
          <Button size="sm" variant="ghost" onClick={loadMods} disabled={isLoading}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab: Installed Mods */}
      {activeSubTab === "installed" && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionTitle className="text-base font-semibold">Installed Packages & Mods</SectionTitle>
              <Muted className="text-xs">Manage files in /data/mods directory</Muted>
            </div>
            <Badge tone="neutral">{mods.length} files</Badge>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Scanning mods folder...</div>
          ) : mods.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm space-y-3">
              <p>No mod packages installed yet.</p>
              <Button size="sm" variant="secondary" onClick={() => setActiveSubTab("search")}>
                Browse Modrinth Catalog
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {mods.map((mod) => (
                <div key={mod.fileName} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">{mod.name}</span>
                      {mod.version && <Badge tone="neutral" className="text-xs">{mod.version}</Badge>}
                      {mod.loader && mod.loader !== "unknown" && (
                        <Badge tone="primary" className="capitalize text-xs">
                          {mod.loader}
                        </Badge>
                      )}
                      {!mod.enabled && (
                        <Badge tone="danger" className="text-xs">Disabled</Badge>
                      )}
                    </div>
                    {mod.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{mod.description}</p>
                    )}
                    <Muted className="text-xs font-mono">
                      {mod.fileName} • {(mod.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                    </Muted>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleToggle(mod)}
                    >
                      {mod.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(mod.fileName, mod.name)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab: Modrinth Search / Store */}
      {activeSubTab === "search" && (
        <div className="space-y-4">
          <form onSubmit={handleSearchModrinth} className="flex gap-2">
            <Input
              placeholder="Search mods on Modrinth (e.g. Sodium, Lithium, JourneyMap)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="primary" disabled={isSearching}>
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <Card className="p-5 divide-y divide-border">
              {searchResults.map((item) => (
                <div key={item.project_id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {item.icon_url ? (
                      <img
                        src={item.icon_url}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover bg-surface shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 text-lg">
                        📦
                      </div>
                    )}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">{item.title}</span>
                        <Muted className="text-xs">by {item.author}</Muted>
                        <Badge tone="neutral" className="text-xs">
                          {item.downloads.toLocaleString()} downloads
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.loaders.slice(0, 3).map((l) => (
                          <span key={l} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border">
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={installingProject === item.project_id}
                    onClick={() => handleInstallFromModrinth(item)}
                    className="shrink-0"
                  >
                    {installingProject === item.project_id ? "Installing..." : "Install Mod"}
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
