"use client";

import { useState, type SubmitEvent } from "react";

import { Badge, Button, Card, Input } from "@/components/ui";

interface WorldControlsProps {
  onExecuteCommand: (command: string) => Promise<string>;
  isBusy: boolean;
  currentDifficulty?: string;
  onRefreshStatus?: () => void;
  onShowFeedback?: (message: string, isError?: boolean) => void;
}

export function WorldControls({
  onExecuteCommand,
  isBusy,
  currentDifficulty,
  onRefreshStatus,
  onShowFeedback,
}: WorldControlsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [pendingRestart, setPendingRestart] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const activeDifficulty = selectedDifficulty ?? currentDifficulty ?? "normal";
  const runCommand = async (cmd: string) => {
    await onExecuteCommand(cmd);
  };

  const handleBroadcast = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = broadcastMessage.trim();
    if (!clean) return;
    await onExecuteCommand(`say [ANNOUNCEMENT] ${clean}`);
    setBroadcastMessage("");
  };
  const handleImportMap = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    if (!name.endsWith(".zip") && !name.endsWith(".tar.gz") && !name.endsWith(".tgz")) {
      onShowFeedback?.("Only .zip and .tar.gz world archives are supported", true);
      return;
    }

    if (
      !window.confirm(
        `Import map archive "${file.name}"?\n\nWarning: An automatic safety backup will be created, and the active server world will be replaced. A server restart will be required.`
      )
    ) {
      e.target.value = "";
      return;
    }

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/world/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to import world");
      }

      setPendingRestart(true);
      onShowFeedback?.(data.message || "Map successfully imported! Restart server to load.");
      onRefreshStatus?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import failed";
      onShowFeedback?.(msg, true);
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="lg">
        <Badge tone="warning" className="mb-2">
          <span>Environment &amp; Server State</span>
        </Badge>
        <h2 className="text-xl font-bold text-heading tracking-tight">World &amp; Environment Controls</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Control day/night cycles, weather patterns, gamerules, and perform server maintenance.
        </p>
      </Card>

      {pendingRestart && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold text-sm">Server restart required</p>
              <p className="text-xs text-amber-200/80">
                New world map files have been extracted. Restart Minecraft server container to load the new map.
              </p>
            </div>
          </div>
          <Button size="sm" variant="secondary" onClick={() => setPendingRestart(false)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Map Import Card */}
      <Card padding="lg" className="space-y-3 border-primary/20 bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🗺️</span>
              <h3 className="text-base font-semibold text-heading">Import New World Map</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upload a custom map archive (.zip or .tar.gz). A safety backup will be generated before replacing the world.
            </p>
          </div>

          <label className="cursor-pointer self-start sm:self-auto shrink-0">
            <input
              type="file"
              accept=".zip,.tar.gz,.tgz"
              className="hidden"
              disabled={isImporting || isBusy}
              onChange={handleImportMap}
            />
            <span className="inline-flex items-center justify-center font-semibold transition cursor-pointer rounded-xl px-3 py-2 text-xs bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm">
              {isImporting ? "Importing Map..." : "Upload & Import Map"}
            </span>
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time of Day */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-heading text-base">Time of Day</h3>
              <p className="text-xs text-muted-foreground">Set the in-game world clock</p>
            </div>
            <span className="text-2xl">☀️</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => runCommand("time set day")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-amber-500/40"
            >
              <div className="text-lg">🌅</div>
              <div className="text-xs font-semibold text-heading mt-1">Day</div>
              <div className="text-[10px] text-subtle-foreground font-mono">1000 ticks</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("time set noon")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-amber-500/40"
            >
              <div className="text-lg">☀️</div>
              <div className="text-xs font-semibold text-heading mt-1">Noon</div>
              <div className="text-[10px] text-subtle-foreground font-mono">6000 ticks</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("time set night")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-indigo-500/40"
            >
              <div className="text-lg">🌙</div>
              <div className="text-xs font-semibold text-heading mt-1">Night</div>
              <div className="text-[10px] text-subtle-foreground font-mono">13000 ticks</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("time set midnight")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-indigo-500/40"
            >
              <div className="text-lg">🌌</div>
              <div className="text-xs font-semibold text-heading mt-1">Midnight</div>
              <div className="text-[10px] text-subtle-foreground font-mono">18000 ticks</div>
            </Button>
          </div>
        </Card>

        {/* Weather Controls */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-heading text-base">Weather Machine</h3>
              <p className="text-xs text-muted-foreground">Control rain, clouds, and storms</p>
            </div>
            <span className="text-2xl">🌦️</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => runCommand("weather clear")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-sky-500/40"
            >
              <div className="text-lg">☀️</div>
              <div className="text-xs font-semibold text-heading mt-1">Clear</div>
              <div className="text-[10px] text-subtle-foreground">Sunny sky</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("weather rain")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-sky-500/40"
            >
              <div className="text-lg">🌧️</div>
              <div className="text-xs font-semibold text-heading mt-1">Rain</div>
              <div className="text-[10px] text-subtle-foreground">Precipitation</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("weather thunder")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-sky-500/40"
            >
              <div className="text-lg">⚡</div>
              <div className="text-xs font-semibold text-heading mt-1">Thunder</div>
              <div className="text-[10px] text-subtle-foreground">Stormy night</div>
            </Button>
          </div>
        </Card>

        {/* Server Broadcast Chat */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-heading text-base">Broadcast Announcement</h3>
              <p className="text-xs text-muted-foreground">Send server-wide chat message to all players</p>
            </div>
            <span className="text-2xl">📢</span>
          </div>

          <form onSubmit={handleBroadcast} className="flex gap-2">
            <Input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Server restart in 10 minutes..."
              disabled={isBusy}
              mono
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={isBusy || !broadcastMessage.trim()}
              className="px-4 py-2"
            >
              Send
            </Button>
          </form>
        </Card>

        {/* Difficulty & Maintenance */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-heading text-base">Server Maintenance</h3>
              <p className="text-xs text-muted-foreground">World saves and difficulty adjustments</p>
            </div>
            <span className="text-2xl">⚙️</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-foreground font-medium">Difficulty:</span>
              <div className="flex items-center gap-1">
                {["peaceful", "easy", "normal", "hard"].map((diff) => (
                  <Button
                    key={diff}
                    variant="tab"
                    active={activeDifficulty.toLowerCase() === diff}
                    size="sm"
                    onClick={async () => {
                      setSelectedDifficulty(diff);
                      await runCommand(`difficulty ${diff}`);
                      onRefreshStatus?.();
                    }}
                    disabled={isBusy}
                    className="px-2.5 py-1 text-[11px] capitalize font-mono"
                  >
                    {diff}
                  </Button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 flex items-center gap-2">
              <Button
                variant="success"
                onClick={() => runCommand("save-all")}
                disabled={isBusy}
                className="flex-1 py-2 px-3 text-xs"
              >
                <span>💾 Save World (save-all)</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => runCommand("gamerule keepInventory true")}
                disabled={isBusy}
                title="Prevent item drops on death"
                className="py-2 px-3 text-xs font-normal"
              >
                Keep Inv
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
