"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toggle } from "@/components/ui/Toggle";

export interface LiveMapViewProps {
  mapUrl?: string;
  players?: string[];
}

export function LiveMapView({ mapUrl = "http://localhost:8123", players = [] }: LiveMapViewProps) {
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [dimension, setDimension] = useState<string>("surface");
  const [viewMode, setViewMode] = useState<"2.5d" | "2d">("2.5d");
  const [followedPlayer, setFollowedPlayer] = useState<string | null>(null);
  const [trackPlayers, setTrackPlayers] = useState(true);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [loadError, setLoadError] = useState(false);

  const baseUrl = customUrl || mapUrl;

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = urlInput.trim();
    if (clean) {
      setCustomUrl(clean);
      setIsEditingUrl(false);
      setLoadError(false);
    }
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
  }, [baseUrl, dimension, viewMode, followedPlayer]);

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
            <span className="text-success font-bold">●</span> ONLINE · Dynmap 3.7 · Port 8123 ·{" "}
            {dimension.toUpperCase()} ({viewMode.toUpperCase()})
          </p>
        </div>

        <div className="flex items-center gap-2">
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

        {/* Floating Player Markers HUD */}
        {trackPlayers && (
          <div className="absolute bottom-4 left-4 z-10 bg-surface/90 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg max-w-xs space-y-2 select-none">
            <div className="flex items-center justify-between text-overline text-muted-foreground uppercase">
              <span>Tracked Players</span>
              <span className="text-success font-mono font-bold">{players.length} Online</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {players.length === 0 ? (
                <div className="text-xs text-muted-foreground py-1">No players online</div>
              ) : (
                players.map((name) => {
                  const isFollowed = followedPlayer === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFollowedPlayer(isFollowed ? null : name)}
                      className="w-full flex items-center justify-between text-xs gap-3 p-1 rounded hover:bg-surface-raised transition-colors text-left"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://mc-heads.net/avatar/${name}/18`}
                          alt={name}
                          className="w-4 h-4 rounded bg-surface-raised shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://mc-heads.net/avatar/Steve/18";
                          }}
                        />
                        <span className="font-medium text-heading truncate">{name}</span>
                      </div>
                      {isFollowed && (
                        <span className="text-overline uppercase text-primary font-bold px-1 rounded bg-primary/10">
                          Focus
                        </span>
                      )}
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
