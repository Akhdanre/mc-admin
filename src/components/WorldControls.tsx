"use client";

import { useState, type SubmitEvent } from "react";

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
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          <span>Environment & Server State</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">World & Environment Controls</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Control day/night cycles, weather patterns, gamerules, and perform server maintenance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Time of Day */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Time of Day</h3>
              <p className="text-xs text-slate-400">Set the in-game world clock</p>
            </div>
            <span className="text-2xl">☀️</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            <button
              onClick={() => runCommand("time set day")}
              disabled={isBusy}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl transition text-center cursor-pointer"
            >
              <div className="text-lg">🌅</div>
              <div className="text-xs font-semibold text-white mt-1">Day</div>
              <div className="text-[10px] text-slate-500 font-mono">1000 ticks</div>
            </button>
            <button
              onClick={() => runCommand("time set noon")}
              disabled={isBusy}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl transition text-center cursor-pointer"
            >
              <div className="text-lg">☀️</div>
              <div className="text-xs font-semibold text-white mt-1">Noon</div>
              <div className="text-[10px] text-slate-500 font-mono">6000 ticks</div>
            </button>
            <button
              onClick={() => runCommand("time set night")}
              disabled={isBusy}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl transition text-center cursor-pointer"
            >
              <div className="text-lg">🌙</div>
              <div className="text-xs font-semibold text-white mt-1">Night</div>
              <div className="text-[10px] text-slate-500 font-mono">13000 ticks</div>
            </button>
            <button
              onClick={() => runCommand("time set midnight")}
              disabled={isBusy}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl transition text-center cursor-pointer"
            >
              <div className="text-lg">🌌</div>
              <div className="text-xs font-semibold text-white mt-1">Midnight</div>
              <div className="text-[10px] text-slate-500 font-mono">18000 ticks</div>
            </button>
          </div>
        </div>

        {/* Weather Controls */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Weather Machine</h3>
              <p className="text-xs text-slate-400">Control rain, clouds, and storms</p>
            </div>
            <span className="text-2xl">🌦️</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <button
              onClick={() => runCommand("weather clear")}
              disabled={isBusy}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-xl transition text-center cursor-pointer"
            >
              <div className="text-lg">☀️</div>
              <div className="text-xs font-semibold text-white mt-1">Clear</div>
              <div className="text-[10px] text-slate-500">Sunny sky</div>
            </button>
            <button
              onClick={() => runCommand("weather rain")}
              disabled={isBusy}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-xl transition text-center cursor-pointer"
            >
              <div className="text-lg">🌧️</div>
              <div className="text-xs font-semibold text-white mt-1">Rain</div>
              <div className="text-[10px] text-slate-500">Precipitation</div>
            </button>
            <button
              onClick={() => runCommand("weather thunder")}
              disabled={isBusy}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 rounded-xl transition text-center cursor-pointer"
            >
              <div className="text-lg">⚡</div>
              <div className="text-xs font-semibold text-white mt-1">Thunder</div>
              <div className="text-[10px] text-slate-500">Stormy night</div>
            </button>
          </div>
        </div>

        {/* Server Broadcast Chat */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Broadcast Announcement</h3>
              <p className="text-xs text-slate-400">Send server-wide chat message to all players</p>
            </div>
            <span className="text-2xl">📢</span>
          </div>

          <form onSubmit={handleBroadcast} className="flex gap-2">
            <input
              type="text"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="e.g. Server restart in 10 minutes..."
              disabled={isBusy}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={isBusy || !broadcastMessage.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl transition cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>

        {/* Difficulty & Maintenance */}
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Server Maintenance</h3>
              <p className="text-xs text-slate-400">World saves and difficulty adjustments</p>
            </div>
            <span className="text-2xl">⚙️</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-300 font-medium">Difficulty:</span>
              <div className="flex items-center gap-1">
                {["peaceful", "easy", "normal", "hard"].map((diff) => (
                  <button
                    key={diff}
                    onClick={async () => {
                      setDifficulty(diff);
                      await runCommand(`difficulty ${diff}`);
                    }}
                    disabled={isBusy}
                    className={`px-2.5 py-1 text-[11px] rounded-lg capitalize font-mono transition cursor-pointer ${
                      difficulty === diff
                        ? "bg-indigo-600 text-white font-semibold"
                        : "bg-slate-950 text-slate-400 hover:text-white"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2">
              <button
                onClick={() => runCommand("save-all")}
                disabled={isBusy}
                className="flex-1 py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>💾 Save World (save-all)</span>
              </button>
              <button
                onClick={() => runCommand("gamerule keepInventory true")}
                disabled={isBusy}
                title="Prevent item drops on death"
                className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs rounded-xl transition cursor-pointer"
              >
                Keep Inv
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
