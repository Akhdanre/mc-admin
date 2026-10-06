"use client";

import { useState, useRef, useEffect, type SubmitEvent } from "react";
import { Badge, Button, Input } from "@/components/ui";

interface ConsoleViewProps {
  onExecuteCommand: (command: string) => Promise<string>;
  isBusy: boolean;
}

interface CommandLogEntry {
  id: string;
  command: string;
  response: string;
  time: string;
  isError?: boolean;
}

export function ConsoleView({ onExecuteCommand, isBusy }: ConsoleViewProps) {
  const [command, setCommand] = useState("");
  const [logs, setLogs] = useState<CommandLogEntry[]>([
    {
      id: "initial",
      command: "System initialized",
      response: "RCON Terminal session ready. Enter Minecraft console commands below.",
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: "list", desc: "List players" },
    { label: "whitelist list", desc: "List whitelisted" },
    { label: "time query daytime", desc: "Current time" },
    { label: "seed", desc: "World seed" },
    { label: "save-all", desc: "Save world" },
    { label: "tps", desc: "Server TPS" },
    { label: "gamerule keepInventory", desc: "Check keepInventory" },
    { label: "weather clear", desc: "Clear skies" },
  ];

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = command.trim();
    if (!clean) return;

    setCommand("");
    await runCommand(clean);
  };

  const runCommand = async (cmdToRun: string) => {
    const time = new Date().toLocaleTimeString();
    try {
      const result = await onExecuteCommand(cmdToRun);
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: cmdToRun,
          response: result,
          time,
        },
      ]);
    } catch (err: unknown) {
      setLogs((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          command: cmdToRun,
          response: err instanceof Error ? err.message : String(err),
          time,
          isError: true,
        },
      ]);
    }
  };

  const clearLogs = () => {
    setLogs([
      {
        id: "cleared",
        command: "clear",
        response: "Console log history cleared.",
        time: new Date().toLocaleTimeString(),
      },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface/60 border border-border/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge tone="success" className="mb-2">
            <span>Direct Console Terminal</span>
          </Badge>
          <h2 className="text-xl font-bold text-white tracking-tight">RCON Command Center</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Execute raw server commands with instant operator privileges.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={clearLogs}
          className="self-start sm:self-auto text-muted-foreground hover:text-white"
        >
          Clear Screen
        </Button>
      </div>

      {/* Preset Command Shortcuts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] text-subtle-foreground font-medium shrink-0 uppercase tracking-wider">
          Presets:
        </span>
        {presets.map((p) => (
          <Button
            key={p.label}
            variant="secondary"
            onClick={() => runCommand(p.label)}
            disabled={isBusy}
            title={p.desc}
            className="font-mono shrink-0 bg-surface/80 hover:bg-surface-raised"
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Terminal Output Window */}
      <div className="bg-overlay rounded-2xl border border-border/90 overflow-hidden shadow-2xl flex flex-col h-[480px]">
        {/* Terminal Titlebar */}
        <div className="bg-surface/80 px-4 py-2.5 border-b border-border/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono text-muted-foreground ml-2">minecraft-server: rcon-cli</span>
          </div>
          <span className="text-[11px] text-subtle-foreground font-mono">session: active</span>
        </div>

        {/* Terminal Logs Content */}
        <div
          ref={logContainerRef}
          className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-y-auto space-y-3 scroll-smooth"
        >
          {logs.map((entry) => (
            <div key={entry.id} className="space-y-1">
              <div className="flex items-center gap-2 text-subtle-foreground text-[11px]">
                <span>[{entry.time}]</span>
                <span className="text-primary-muted font-bold">&gt;</span>
                <span className="text-slate-200 font-semibold">{entry.command}</span>
              </div>
              <div
                className={`pl-4 whitespace-pre-wrap leading-relaxed ${
                  entry.isError ? "text-danger-foreground" : "text-success-foreground/90"
                }`}
              >
                {entry.response}
              </div>
            </div>
          ))}
        </div>

        {/* Terminal Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 bg-surface/60 border-t border-border flex gap-2">
          <span className="text-primary-muted font-mono text-sm self-center font-bold pl-2">&gt;</span>
          <Input
            mono
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Type a Minecraft command (e.g. say hello, time set day, gamemode creative)..."
            disabled={isBusy}
            className="flex-1 border-0 bg-transparent px-0 py-0 text-xs text-white placeholder:text-faint-foreground"
            autoFocus
          />
          <Button type="submit" variant="primary" disabled={isBusy || !command.trim()}>
            {isBusy ? "Running..." : "Execute"}
          </Button>
        </form>
      </div>
    </div>
  );
}
