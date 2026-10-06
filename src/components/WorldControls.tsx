"use client";

import { useState, type SubmitEvent } from "react";

import { Badge, Button, Card, Input } from "@/components/ui";

interface WorldControlsProps {
  onExecuteCommand: (command: string) => Promise<string>;
  isBusy: boolean;
}

export function WorldControls({ onExecuteCommand, isBusy }: WorldControlsProps) {
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [difficulty, setDifficulty] = useState<string>("normal");

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="lg">
        <Badge tone="warning" className="mb-2">
          <span>Environment &amp; Server State</span>
        </Badge>
        <h2 className="text-xl font-bold text-white tracking-tight">World &amp; Environment Controls</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Control day/night cycles, weather patterns, gamerules, and perform server maintenance.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time of Day */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Time of Day</h3>
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
              <div className="text-xs font-semibold text-white mt-1">Day</div>
              <div className="text-[10px] text-subtle-foreground font-mono">1000 ticks</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("time set noon")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-amber-500/40"
            >
              <div className="text-lg">☀️</div>
              <div className="text-xs font-semibold text-white mt-1">Noon</div>
              <div className="text-[10px] text-subtle-foreground font-mono">6000 ticks</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("time set night")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-indigo-500/40"
            >
              <div className="text-lg">🌙</div>
              <div className="text-xs font-semibold text-white mt-1">Night</div>
              <div className="text-[10px] text-subtle-foreground font-mono">13000 ticks</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("time set midnight")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-indigo-500/40"
            >
              <div className="text-lg">🌌</div>
              <div className="text-xs font-semibold text-white mt-1">Midnight</div>
              <div className="text-[10px] text-subtle-foreground font-mono">18000 ticks</div>
            </Button>
          </div>
        </Card>

        {/* Weather Controls */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Weather Machine</h3>
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
              <div className="text-xs font-semibold text-white mt-1">Clear</div>
              <div className="text-[10px] text-subtle-foreground">Sunny sky</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("weather rain")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-sky-500/40"
            >
              <div className="text-lg">🌧️</div>
              <div className="text-xs font-semibold text-white mt-1">Rain</div>
              <div className="text-[10px] text-subtle-foreground">Precipitation</div>
            </Button>
            <Button
              variant="secondary"
              onClick={() => runCommand("weather thunder")}
              disabled={isBusy}
              className="flex-col gap-0 p-3 hover:border-sky-500/40"
            >
              <div className="text-lg">⚡</div>
              <div className="text-xs font-semibold text-white mt-1">Thunder</div>
              <div className="text-[10px] text-subtle-foreground">Stormy night</div>
            </Button>
          </div>
        </Card>

        {/* Server Broadcast Chat */}
        <Card padding="lg" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Broadcast Announcement</h3>
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
              <h3 className="font-bold text-white text-base">Server Maintenance</h3>
              <p className="text-xs text-muted-foreground">World saves and difficulty adjustments</p>
            </div>
            <span className="text-2xl">⚙️</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-300 font-medium">Difficulty:</span>
              <div className="flex items-center gap-1">
                {["peaceful", "easy", "normal", "hard"].map((diff) => (
                  <Button
                    key={diff}
                    variant="tab"
                    active={difficulty === diff}
                    size="sm"
                    onClick={async () => {
                      setDifficulty(diff);
                      await runCommand(`difficulty ${diff}`);
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
