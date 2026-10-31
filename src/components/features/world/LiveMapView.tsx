"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toggle } from "@/components/ui/Toggle";
import { cn } from "@/lib/cn";
import { apiGet } from "@/lib/api";
import type { PlayerLocation } from "@/types";

export interface LiveMapViewProps {
  mapUrl?: string;
  players?: string[];
  playerLocations?: Record<string, PlayerLocation> | PlayerLocation[];
  onExecuteCommand?: (command: string) => Promise<string | unknown>;
}

export function LiveMapView({
  mapUrl = "http://localhost:8123",
  players = [],
  playerLocations = [],
  onExecuteCommand,
}: LiveMapViewProps) {
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [dimension, setDimension] = useState<string>("surface");
  const [viewMode, setViewMode] = useState<"2.5d" | "2d">("2.5d");
  const [followedPlayer, setFollowedPlayer] = useState<string | null>(null);
  const [targetCoords, setTargetCoords] = useState<{ x: number; y: number; z: number } | null>(
    null
  );
  const [trackPlayers, setTrackPlayers] = useState(true);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [loadError, setLoadError] = useState(false);

  // Dynmap Real Engine State
  const [isPaused, setIsPaused] = useState(false);
  const [tilesRendered, setTilesRendered] = useState<number | null>(null);
  const [isCommandBusy, setIsCommandBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const baseUrl = customUrl || mapUrl;

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Fetch real Dynmap tile statistics and pause state from server
  useEffect(() => {
    let ignore = false;
    apiGet<{ tilesRendered: number | null; isPaused: boolean }>("/api/map/stats")
      .then((data) => {
        if (!ignore && data) {
          if (typeof data.tilesRendered === "number") {
            setTilesRendered(data.tilesRendered);
          }
          setIsPaused(Boolean(data.isPaused));
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = urlInput.trim();
    if (clean) {
      setCustomUrl(clean);
      setIsEditingUrl(false);
      setLoadError(false);
    }
  };

  // Option 2: Dynmap Engine Controls (Pause, Resume, Fullrender)
  const handleTogglePause = async () => {
    if (!onExecuteCommand) {
      setIsPaused((prev) => !prev);
      showStatus(isPaused ? "Engine resumed (local)" : "Engine paused (local)");
      return;
    }

    setIsCommandBusy(true);
    try {
      if (isPaused) {
        await onExecuteCommand("dynmap pause none");
        setIsPaused(false);
        showStatus("Dynmap engine RESUMED. Live tile updates active.");
      } else {
        await onExecuteCommand("dynmap pause all");
        setIsPaused(true);
        showStatus("Dynmap engine PAUSED. Background disk & CPU I/O halted.");
      }
    } catch {
      showStatus("Failed to toggle map engine pause");
    } finally {
      setIsCommandBusy(false);
    }
  };

  const handleTriggerRender = async () => {
    const worldName = dimension === "nether" ? "DIM-1" : dimension === "end" ? "DIM1" : "world";
    if (!onExecuteCommand) {
      showStatus(`Started full render for ${worldName} (simulated)`);
      return;
    }

    setIsCommandBusy(true);
    try {
      await onExecuteCommand(`dynmap fullrender ${worldName}`);
      showStatus(`Full render started for ${worldName}. Check console for progress.`);
    } catch {
      showStatus(`Failed to trigger fullrender for ${worldName}`);
    } finally {
      setIsCommandBusy(false);
    }
  };

  // Option 1: Merged Player List with Real-time GPS Coordinates (real players only)
  const locationsMap = useMemo(() => {
    if (!playerLocations) return new Map<string, PlayerLocation>();
    if (Array.isArray(playerLocations)) {
      return new Map(playerLocations.map((l) => [l.username.toLowerCase(), l]));
    }
    return new Map(Object.entries(playerLocations).map(([key, val]) => [key.toLowerCase(), val]));
  }, [playerLocations]);

  const displayPlayers = useMemo(() => {
    return players.map((name) => {
      const loc = locationsMap.get(name.toLowerCase());
      return {
        name,
        dimension: loc?.dimension || "overworld",
        coords: loc ? { x: Math.round(loc.x), y: Math.round(loc.y), z: Math.round(loc.z) } : null,
      };
    });
  }, [players, locationsMap]);

  const handleSelectPlayer = (player: {
    name: string;
    dimension: string;
    coords: { x: number; y: number; z: number } | null;
  }) => {
    if (followedPlayer === player.name) {
      // Unfocus
      setFollowedPlayer(null);
      setTargetCoords(null);
      showStatus("Unfocused player camera");
      return;
    }

    setFollowedPlayer(player.name);
    if (player.coords) {
      setTargetCoords(player.coords);
    }

    // Auto-switch dimension to match player's location
    if (player.dimension === "the_nether" || player.dimension === "nether") {
      setDimension("nether");
    } else if (player.dimension === "the_end" || player.dimension === "end") {
      setDimension("end");
    } else {
      setDimension((prev) => (prev === "caves" ? "caves" : "surface"));
    }

    showStatus(
      `Focused on ${player.name}${player.coords ? ` (${player.coords.x}, ${player.coords.y}, ${player.coords.z})` : ""}`
    );
  };

  const iframeSrc = useMemo(() => {
    try {
      const parsed = new URL(baseUrl);
      let worldName = "world";
      let mapName = "surface";

      switch (dimension) {
        case "surface":
          worldName = "world";
          mapName = viewMode === "2d" ? "flat" : "surface";
          break;
        case "caves":
          worldName = "world";
          mapName = viewMode === "2d" ? "flat" : "cave";
          break;
        case "nether":
          worldName = "DIM-1";
          mapName = viewMode === "2d" ? "flat" : "nether";
          break;
        case "end":
          worldName = "DIM1";
          mapName = viewMode === "2d" ? "flat" : "the_end";
          break;
      }

      parsed.searchParams.set("worldname", worldName);
      parsed.searchParams.set("mapname", mapName);

      if (targetCoords) {
        parsed.searchParams.set("x", String(targetCoords.x));
        parsed.searchParams.set("y", String(targetCoords.y));
        parsed.searchParams.set("z", String(targetCoords.z));
        parsed.searchParams.set("zoom", "4");
      }

      if (followedPlayer) {
        parsed.searchParams.set("playername", followedPlayer);
      } else {
        parsed.searchParams.delete("playername");
      }
      return parsed.toString();
    } catch {
      const sep = baseUrl.includes("?") ? "&" : "?";
      let worldName = "world";
      let mapName = viewMode === "2d" ? "flat" : "surface";
      if (dimension === "caves") {
        worldName = "world";
        mapName = viewMode === "2d" ? "flat" : "cave";
      } else if (dimension === "nether") {
        worldName = "DIM-1";
        mapName = viewMode === "2d" ? "flat" : "nether";
      } else if (dimension === "end") {
        worldName = "DIM1";
        mapName = viewMode === "2d" ? "flat" : "the_end";
      }
      return `${baseUrl}${sep}worldname=${worldName}&mapname=${mapName}${followedPlayer ? `&playername=${encodeURIComponent(followedPlayer)}` : ""}`;
    }
  }, [baseUrl, dimension, viewMode, targetCoords, followedPlayer]);

  const dimensionInfo = useMemo(() => {
    switch (dimension) {
      case "surface":
        return "Spawn: 0, 64, 0 · Overworld";
      case "caves":
        return "Cave Subterranean · Depth Y -64 to 64";
      case "nether":
        return "Nether Dimension · DIM-1";
      case "end":
        return "The End Dimension · DIM1";
      default:
        return "Spawn: 0, 64, 0";
    }
  }, [dimension]);

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Live World Map
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className={isPaused ? "text-warning font-bold" : "text-success font-bold"}>
              ●
            </span>{" "}
            {isPaused ? "PAUSED" : "ONLINE"} · Dynmap 3.7 ·{" "}
            {tilesRendered !== null ? `${tilesRendered.toLocaleString()} Tiles` : "Tiles Loaded"} ·{" "}
            Port 8123 · {dimension.toUpperCase()} ({viewMode.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {statusMessage && (
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface border border-border text-heading shadow-xs animate-in fade-in duration-200">
              {statusMessage}
            </span>
          )}

          {isEditingUrl ? (
            <form onSubmit={handleSaveUrl} className="flex items-center gap-1.5">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8123"
                className="bg-surface-raised border border-border rounded-lg px-2.5 py-1 text-xs font-mono text-heading focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" variant="primary" size="sm" className="h-7 text-xs px-2.5">
                Save
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingUrl(false)}
                className="h-7 text-xs px-2"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <>
              {/* Option 2: Engine Pause/Resume Control */}
              <Button
                size="sm"
                variant={isPaused ? "secondary" : "outline"}
                disabled={isCommandBusy}
                onClick={handleTogglePause}
                className={cn(
                  "text-xs h-7 px-2.5 font-mono",
                  isPaused && "border-amber-500/40 text-amber-600 dark:text-amber-400"
                )}
              >
                {isPaused ? "▶ Resume Engine" : "⏸ Pause Engine"}
              </Button>

              {/* Option 2: Trigger Fullrender */}
              <Button
                size="sm"
                variant="outline"
                disabled={isCommandBusy}
                onClick={handleTriggerRender}
                className="text-xs h-7 px-2.5"
                title="Rerender chunk tiles for current world"
              >
                ⚡ Rerender
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUrlInput(baseUrl);
                  setIsEditingUrl(true);
                }}
                className="text-xs h-7 px-2.5"
              >
                Configure URL
              </Button>

              <a
                href={iframeSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
              >
                Open Web (8123) ↗
              </a>
            </>
          )}
        </div>
      </div>

      {/* Map Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface border border-border p-2.5 rounded-xl shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dimension Selector */}
          <SegmentedControl
            size="sm"
            value={dimension}
            onChange={(val) => {
              setDimension(val);
              setTargetCoords(null);
              setLoadError(false);
            }}
            options={[
              { value: "surface", label: "Surface (Overworld)" },
              { value: "caves", label: "Caves" },
              { value: "nether", label: "Nether" },
              { value: "end", label: "The End" },
            ]}
          />

          {/* Projection View Mode: 2.5D Isometric vs 2D Flat */}
          <SegmentedControl
            size="sm"
            value={viewMode}
            onChange={(val) => {
              setViewMode(val as "2.5d" | "2d");
              setLoadError(false);
            }}
            options={[
              { value: "2.5d", label: "2.5D Isometric" },
              { value: "2d", label: "2D Flat" },
            ]}
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-muted-foreground hidden lg:block">
            {dimensionInfo} · {viewMode === "2.5d" ? "Isometric 3D" : "Top-Down Ortho"}
          </div>
          <Toggle
            checked={trackPlayers}
            onChange={(val) => setTrackPlayers(val)}
            label="Live GPS Tracking"
          />
        </div>
      </div>

      {/* Map Viewport Card */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden flex-1 relative flex flex-col">
        {!loadError ? (
          <iframe
            key={iframeSrc}
            src={iframeSrc}
            title="Minecraft Live World Map"
            onError={() => setLoadError(true)}
            className="w-full h-full border-0 bg-slate-950"
            allow="fullscreen"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-surface-raised/30">
            <div className="w-16 h-16 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-3xl mb-3">
              🗺️
            </div>
            <h3 className="text-base font-semibold text-heading">Map Server Not Reachable</h3>
            <p className="text-xs text-muted-foreground max-w-md mt-1 mb-4 leading-relaxed">
              Dynmap web server at <code className="font-mono text-primary">{iframeSrc}</code> did
              not respond. Check port forwarding or update the Map URL above.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLoadError(false)}
              className="text-xs"
            >
              Retry Connection
            </Button>
          </div>
        )}

        {/* Option 1: Floating Player Markers HUD with Real-time GPS Coordinates (Live Online Players Only) */}
        {trackPlayers && (
          <div className="absolute bottom-4 left-4 z-10 bg-surface/90 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg w-72 sm:w-80 space-y-2 select-none">
            <div className="flex items-center justify-between text-overline text-muted-foreground uppercase">
              <span>GPS Tracked Players</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  displayPlayers.length > 0 ? "text-success" : "text-muted-foreground"
                )}
              >
                {displayPlayers.length} Online
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {displayPlayers.length === 0 ? (
                <div className="text-xs text-muted-foreground py-3 text-center">
                  No players currently online on this server
                </div>
              ) : (
                displayPlayers.map((player) => {
                  const isFollowed = followedPlayer === player.name;
                  return (
                    <button
                      key={player.name}
                      type="button"
                      onClick={() => handleSelectPlayer(player)}
                      className={cn(
                        "w-full flex items-center justify-between text-xs p-1.5 rounded-lg border transition-all text-left group",
                        isFollowed
                          ? "bg-primary/15 border-primary text-heading shadow-xs"
                          : "bg-surface-raised/60 border-border hover:bg-surface-raised text-heading"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://mc-heads.net/avatar/${player.name}/22`}
                          alt={player.name}
                          className="w-5 h-5 rounded bg-surface border border-border shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://mc-heads.net/avatar/Steve/22";
                          }}
                        />
                        <div className="truncate min-w-0">
                          <div className="font-semibold text-heading truncate leading-tight group-hover:text-primary transition-colors">
                            {player.name}
                          </div>
                          <div className="text-muted-foreground font-mono text-[10px] leading-tight truncate">
                            {player.coords
                              ? `X:${player.coords.x} Y:${player.coords.y} Z:${player.coords.z}`
                              : "Coords unknown"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={cn(
                            "px-1 py-0.5 rounded text-[9px] uppercase font-mono border leading-none",
                            player.dimension === "the_nether" || player.dimension === "nether"
                              ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                              : player.dimension === "the_end" || player.dimension === "end"
                                ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          )}
                        >
                          {player.dimension === "the_nether" || player.dimension === "nether"
                            ? "Nether"
                            : player.dimension === "the_end" || player.dimension === "end"
                              ? "End"
                              : "Overworld"}
                        </span>
                        {isFollowed && (
                          <span className="text-primary text-[11px] font-bold animate-pulse">
                            🎯
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
