"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Toggle } from "@/components/ui/Toggle";
import { MOCK_PLAYERS } from "@/lib/mockData";
import { cn } from "@/lib/cn";

export interface LiveMapProps {
  mapUrl?: string;
}

export function LiveMap({ mapUrl = "http://localhost:8123" }: LiveMapProps) {
  const [currentUrl, setCurrentUrl] = useState(mapUrl);
  const [dimension, setDimension] = useState<string>("surface");
  const [trackPlayers, setTrackPlayers] = useState(true);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(mapUrl);
  const [loadError, setLoadError] = useState(false);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      setCurrentUrl(urlInput.trim());
      setIsEditingUrl(false);
      setLoadError(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Live World Map
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-emerald-500 font-bold">●</span> ONLINE · Dynmap 3.7-beta-6 · 169,708 Tiles Rendered · Port 8123
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
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Engine Idle
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {}}
                className="text-xs h-7 px-2.5"
              >
                ⏸ Pause
              </Button>
              <a
                href={currentUrl}
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
        <SegmentedControl
          size="sm"
          value={dimension}
          onChange={(val) => setDimension(val)}
          options={[
            { value: "surface", label: "Surface (Overworld)" },
            { value: "caves", label: "Caves" },
            { value: "nether", label: "Nether" },
            { value: "end", label: "The End" },
          ]}
        />

        <div className="flex items-center gap-4">
          <div className="text-xs font-mono text-muted-foreground hidden sm:block">
            Spawn: <span className="text-heading font-medium">0, 64, 0</span>
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
            src={currentUrl}
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
              Dynmap or BlueMap web server at <code className="font-mono text-primary">{currentUrl}</code> did not respond. Check port forwarding or update the Map URL above.
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

        {/* Floating Player Markers HUD (Penpot Overlay Pattern) */}
        {trackPlayers && (
          <div className="absolute bottom-4 left-4 z-10 bg-surface/90 backdrop-blur-md border border-border rounded-xl p-3 shadow-lg max-w-xs space-y-2 select-none">
            <div className="flex items-center justify-between text-overline text-muted-foreground uppercase">
              <span>Tracked Players</span>
              <span className="text-emerald-500 font-mono font-bold">{MOCK_PLAYERS.length} Online</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {MOCK_PLAYERS.map((p) => (
                <div key={p.uuid} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-1.5 truncate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://mc-heads.net/avatar/${p.username}/18`}
                      alt={p.username}
                      className="w-4 h-4 rounded bg-surface-raised"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://mc-heads.net/avatar/Steve/18";
                      }}
                    />
                    <span className="font-medium text-heading truncate">{p.username}</span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">
                    {p.x.toFixed(0)}, {p.z.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
