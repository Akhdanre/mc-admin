"use client";

import { useState, useRef, useEffect, type SubmitEvent } from "react";
import { Button, SegmentedControl } from "@/components/ui";
import { MOCK_CONSOLE_LOGS } from "@/lib/mockData";
import { cn } from "@/lib/cn";

export interface ConsoleViewProps {
  onExecuteCommand: (command: string) => Promise<string>;
  isBusy: boolean;
}

interface LogItem {
  id: string;
  time: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  isCommand?: boolean;
}

export function ConsoleView({ onExecuteCommand, isBusy }: ConsoleViewProps) {
  const [command, setCommand] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "INFO" | "WARN" | "ERROR">("ALL");
  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>(() => {
    return MOCK_CONSOLE_LOGS.map((raw, idx) => {
      let level: "INFO" | "WARN" | "ERROR" = "INFO";
      if (raw.includes("WARN")) level = "WARN";
      if (raw.includes("ERROR")) level = "ERROR";
      const timeMatch = raw.match(/\[(\d\d:\d\d:\d\d)/);
      const time = timeMatch ? timeMatch[1] : "00:00:00";
      return {
        id: `mock-${idx}`,
        time,
        level,
        message: raw,
      };
    });
  });

  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isPaused && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const quickPresets = [
    { label: "/tps", cmd: "tps" },
    { label: "/list", cmd: "list" },
    { label: "/save-all", cmd: "save-all" },
    { label: "/seed", cmd: "seed" },
    { label: "/whitelist list", cmd: "whitelist list" },
    { label: "/weather clear", cmd: "weather clear" },
  ];

  const handleRun = async (cmdToRun: string) => {
    const clean = cmdToRun.trim().replace(/^\//, "");
    if (!clean) return;

    const time = new Date().toTimeString().split(" ")[0];
    const userLog: LogItem = {
      id: `cmd-${Date.now()}`,
      time,
      level: "INFO",
      message: `[RCON Command] /> ${clean}`,
      isCommand: true,
    };

    setLogs((prev) => [...prev, userLog]);

    try {
      const response = await onExecuteCommand(clean);
      const lines = response.split("\n").filter(Boolean);
      const responseLogs: LogItem[] = lines.map((line, i) => ({
        id: `resp-${Date.now()}-${i}`,
        time: new Date().toTimeString().split(" ")[0],
        level: line.toLowerCase().includes("error") ? "ERROR" : "INFO",
        message: line,
      }));
      setLogs((prev) => [...prev, ...responseLogs]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Failed to execute command";
      setLogs((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          time: new Date().toTimeString().split(" ")[0],
          level: "ERROR",
          message: `[RCON ERROR]: ${errMsg}`,
        },
      ]);
    }
  };

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!command.trim() || isBusy) return;
    const toSend = command;
    setCommand("");
    handleRun(toSend);
  };

  const filteredLogs = logs.filter((log) => {
    if (levelFilter === "ALL") return true;
    return log.level === levelFilter;
  });

  const handleDownload = () => {
    const text = logs.map((l) => l.message).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `server-console-${new Date().toISOString().slice(0, 10)}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Console & Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-emerald-500 font-bold">●</span> ONLINE · Interactive RCON Terminal · Buffer 5,000 Lines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            RCON Socket Connected
          </span>
        </div>
      </div>

      {/* Console Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface border border-border p-2.5 rounded-xl">
        <SegmentedControl
          size="sm"
          value={levelFilter}
          onChange={(val) => setLevelFilter(val as typeof levelFilter)}
          options={[
            { value: "ALL", label: "ALL", badge: logs.length },
            { value: "INFO", label: "INFO" },
            { value: "WARN", label: "WARN" },
            { value: "ERROR", label: "ERROR" },
          ]}
        />

        <div className="flex items-center gap-2 ml-auto">
          <Button
            size="sm"
            variant={isPaused ? "primary" : "secondary"}
            onClick={() => setIsPaused(!isPaused)}
            className="text-xs h-7 px-2.5"
          >
            {isPaused ? "Resume Stream" : "Pause Stream"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setLogs([])}
            className="text-xs h-7 px-2.5 text-muted-foreground hover:text-heading"
          >
            Clear Buffer
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="text-xs h-7 px-2.5 text-muted-foreground hover:text-heading"
          >
            Download Log
          </Button>
        </div>
      </div>

      {/* Console Execution Card */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Terminal output */}
        <div
          ref={terminalRef}
          className="flex-1 min-h-[360px] p-4 bg-slate-950 font-mono text-xs leading-relaxed text-slate-200 overflow-y-auto select-text space-y-1"
        >
          {filteredLogs.map((log) => {
            const isWarn = log.level === "WARN";
            const isErr = log.level === "ERROR";
            return (
              <div
                key={log.id}
                className={cn(
                  "flex items-start gap-2 hover:bg-white/5 px-1 py-0.5 rounded transition-colors break-all",
                  isErr && "text-rose-400 bg-rose-950/20",
                  isWarn && "text-amber-300 bg-amber-950/20",
                  log.isCommand && "text-indigo-400 font-semibold"
                )}
              >
                <span className="text-slate-500 shrink-0 select-none">[{log.time}]</span>
                <span
                  className={cn(
                    "text-overline px-1 rounded shrink-0 uppercase",
                    isErr && "bg-rose-500/20 text-rose-300",
                    isWarn && "bg-amber-500/20 text-amber-300",
                    !isErr && !isWarn && "bg-slate-800 text-slate-400"
                  )}
                >
                  {log.level}
                </span>
              </div>
            );
          })}
        </div>

        {/* Bottom Command Prompt Bar */}
        <div className="p-3 bg-surface border-t border-border space-y-2">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1 flex items-center">
              <span className="absolute left-3 font-mono text-sm text-primary-muted font-bold select-none">
                /&gt;
              </span>
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Enter server command (e.g. op username, time set day, tps)..."
                disabled={isBusy}
                className="w-full bg-surface-raised border border-border rounded-lg pl-8 pr-3 py-2 text-xs font-mono text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={isBusy || !command.trim()}
              className="h-9 px-4 text-xs font-medium"
            >
              {isBusy ? "Sending..." : "Execute"}
            </Button>
          </form>

          {/* Preset Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-overline text-muted-foreground uppercase pr-1">
              Quick presets:
            </span>
            {quickPresets.map((preset) => (
              <button
                key={preset.cmd}
                type="button"
                disabled={isBusy}
                onClick={() => handleRun(preset.cmd)}
                className="px-2 py-0.5 bg-surface-raised hover:bg-primary/10 hover:text-primary-muted hover:border-primary/30 border border-border rounded text-xs font-mono text-muted-foreground transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
