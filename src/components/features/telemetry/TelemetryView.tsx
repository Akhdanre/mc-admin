"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/cn";
import type { TelemetryData } from "@/types";

export interface TelemetryViewProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface SparkHotspot {
  rank: string;
  pct: string;
  pctColor: string;
  category: string;
  method: string;
  isAltBg?: boolean;
}

const SPARK_HOTSPOTS: SparkHotspot[] = [
  {
    rank: "#1",
    pct: "18.24%",
    pctColor: "text-danger",
    category: "[MOD LOGIC]",
    method: "com.majruszsdifficulty.undeadarmy.UndeadArmy.tick()",
    isAltBg: false,
  },
  {
    rank: "#2",
    pct: "14.12%",
    pctColor: "text-warning",
    category: "[MOB AI ENGINE]",
    method: "net.minecraft.world.entity.ai.goal.GoalSelector.tick()",
    isAltBg: true,
  },
  {
    rank: "#3",
    pct: "11.85%",
    pctColor: "text-primary",
    category: "[CHUNK TICK]",
    method: "net.minecraft.server.level.ServerChunkCache.tickChunks()",
    isAltBg: false,
  },
  {
    rank: "#4",
    pct: "8.45%",
    pctColor: "text-muted-foreground",
    category: "[BLOCK PHYSICS]",
    method: "net.minecraft.world.level.block.piston.PistonBaseBlock.checkSite()",
    isAltBg: true,
  },
  {
    rank: "#5",
    pct: "6.30%",
    pctColor: "text-muted-foreground",
    category: "[DYNMAP TILE I/O]",
    method: "org.dynmap.forge.DynmapPlugin.renderQueue()",
    isAltBg: false,
  },
];

export function TelemetryView({ onRefresh, isRefreshing = false }: TelemetryViewProps) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [isProfiling, setIsProfiling] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const res = await fetch("/api/telemetry");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // offline fallback
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetch("/api/telemetry")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: TelemetryData | null) => {
        if (mounted && json) setData(json);
      })
      .catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/telemetry")
        .then((res) => (res.ok ? res.json() : null))
        .then((json: TelemetryData | null) => {
          if (mounted && json) setData(json);
        })
        .catch(() => {});
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);
  const handleRefresh = async () => {
    onRefresh?.();
    await fetchTelemetry();
  };

  const handleRunSpark = () => {
    setIsProfiling(true);
    setActionNotice("Sampling 18,402 ticks across server threads...");
    setTimeout(() => {
      setIsProfiling(false);
      setActionNotice("Spark profiler report generated: spark.lucko.me/sample-report-id");
      setTimeout(() => setActionNotice(null), 4000);
    }, 2000);
  };

  // Safe defaults
  const host = data?.host || {
    os: "Linux (Debian)",
    kernel: "6.1.0-53-amd64",
    cpuModel: "Intel Core i5-7200U @ 2.50GHz",
    cores: 2,
    threads: 4,
    loadAvg: [0.42, 0.38, 0.35],
    uptimeSeconds: 86400,
  };

  const metrics = data?.metrics || {
    tps: 20.0,
    mspt: 2.1,
    cpuUsagePct: 12.4,
    jvm: {
      allocatedBytes: 8589934592,
      maxBytes: 8589934592,
      usedBytes: 8128348160,
      usedPct: 94,
      collector: "G1GC Collector · 18ms avg pause",
      eden: "1.45 GB / 1.80 GB (80.5%)",
      survivor: "128 MB / 256 MB (50.0%)",
      tenured: "5.99 GB / 5.94 GB (Cleaned)",
    },
    ram: {
      totalBytes: 16642998272,
      freeBytes: 7838318592,
      usedBytes: 8804679680,
      usedPct: 52,
      cacheBytes: 7945682944,
    },
    disk: {
      totalBytes: 249893834752,
      freeBytes: 194636386304,
      usedBytes: 55257448448,
      usedPct: 22,
    },
  };

  const dims = data?.dimensions || {
    overworld: { mspt: 2.0, tps: 20.0, loadPct: 61 },
    nether: { mspt: 0.1, tps: 20.0, loadPct: 21 },
    end: { mspt: 0.1, tps: 20.0, loadPct: 18 },
  };

  return (
    <div className="space-y-3.5">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-2.5 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-subtle-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Row (Penpot h: 45) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            System Telemetry & Performance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> LIVE TELEMETRY · 3s Polling ·{" "}
            {host.cpuModel} · {(metrics.ram.totalBytes / 1024 / 1024 / 1024).toFixed(1)} GB RAM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 rounded-[6px] border border-border bg-surface text-xs font-medium text-heading hover:bg-surface-raised cursor-pointer shadow-xs"
          >
            {isRefreshing ? "Refreshing..." : "Poll: 3s (Live) ▾"}
          </button>
          <button
            type="button"
            onClick={handleRunSpark}
            disabled={isProfiling}
            className="h-8 px-4 rounded-[6px] bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-medium cursor-pointer shadow-xs"
          >
            {isProfiling ? "Sampling Ticks..." : "Generate Spark Profile (30s)"}
          </button>
        </div>
      </div>

      {/* Host Hardware & Engine Banner */}
      <div className="bg-surface border border-border rounded-[8px] p-3 sm:px-4.5 sm:py-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-heading">
            Host OS: {host.os} · Kernel {host.kernel}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            CPU: {host.cpuModel} ({host.cores} Cores, {host.threads} Threads) · Load Avg:{" "}
            {host.loadAvg.join(", ")}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center h-6 px-2.5 rounded-[4px] text-xs font-medium bg-success-surface text-success border border-success-border font-mono">
            ● {metrics.tps.toFixed(1)} TPS (Stable)
          </span>
          <span className="inline-flex items-center h-6 px-2.5 rounded-[4px] text-xs font-medium bg-primary/10 text-primary border border-primary/20 font-mono">
            MSPT: {metrics.mspt.toFixed(1)} ms
          </span>
        </div>
      </div>

      {/* Telemetry 4-Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: CONTAINER CPU LOAD */}
        <div className="bg-surface border border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-overline text-muted-foreground uppercase">CONTAINER CPU LOAD</div>
          <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
            {metrics.cpuUsagePct}% Utilized
          </div>
          <div>
            <div className="h-1 w-full bg-surface-raised rounded-[2px] overflow-hidden">
              <div
                style={{ width: `${Math.min(100, Math.max(5, metrics.cpuUsagePct))}%` }}
                className="h-full bg-primary rounded-[2px]"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {host.cpuModel.split("@")[0]?.trim()} · {host.threads} Threads active
            </div>
          </div>
        </div>

        {/* Card 2: JVM HEAP ALLOCATION */}
        <div className="bg-surface border border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-overline text-muted-foreground uppercase">JVM HEAP ALLOCATION</div>
          <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
            {(metrics.jvm.usedBytes / 1024 / 1024 / 1024).toFixed(2)} GB /{" "}
            {(metrics.jvm.allocatedBytes / 1024 / 1024 / 1024).toFixed(2)} GB
          </div>
          <div>
            <div className="h-1 w-full bg-surface-raised rounded-[2px] overflow-hidden">
              <div
                style={{ width: `${metrics.jvm.usedPct}%` }}
                className="h-full bg-warning rounded-[2px]"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {metrics.jvm.collector}
            </div>
          </div>
        </div>

        {/* Card 3: HOST PHYSICAL RAM */}
        <div className="bg-surface border border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-overline text-muted-foreground uppercase">HOST PHYSICAL RAM</div>
          <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
            {(metrics.ram.usedBytes / 1024 / 1024 / 1024).toFixed(1)} GB /{" "}
            {(metrics.ram.totalBytes / 1024 / 1024 / 1024).toFixed(1)} GB
          </div>
          <div>
            <div className="h-1 w-full bg-surface-raised rounded-[2px] overflow-hidden">
              <div
                style={{ width: `${metrics.ram.usedPct}%` }}
                className="h-full bg-success rounded-[2px]"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {((metrics.ram.cacheBytes || 0) / 1024 / 1024 / 1024).toFixed(1)} GB OS Cache ·{" "}
              {(metrics.ram.freeBytes / 1024 / 1024 / 1024).toFixed(1)} GB Available
            </div>
          </div>
        </div>

        {/* Card 4: DISK NVME FOOTPRINT */}
        <div className="bg-surface border border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-overline text-muted-foreground uppercase">DISK NVME FOOTPRINT</div>
          <div className="text-xl sm:text-2xl font-semibold text-heading font-mono">
            {Math.round(metrics.disk.usedBytes / 1024 / 1024 / 1024)} GB /{" "}
            {Math.round(metrics.disk.totalBytes / 1024 / 1024 / 1024)} GB
          </div>
          <div>
            <div className="h-1 w-full bg-surface-raised rounded-[2px] overflow-hidden">
              <div
                style={{ width: `${metrics.disk.usedPct}%` }}
                className="h-full bg-success rounded-[2px]"
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              {Math.round(metrics.disk.freeBytes / 1024 / 1024 / 1024)} GB Free · ext4
            </div>
          </div>
        </div>
      </div>

      {/* Deep Telemetry Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Card Left: MSPT & Engine Distribution */}
        <div className="bg-surface border border-border rounded-[8px] p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-overline text-heading uppercase">
              TICK TIME ENGINE DISTRIBUTION (MSPT)
            </span>
            <span className="text-xs font-mono text-success">Target: &lt; 50.0 ms (20 TPS)</span>
          </div>

          {/* Tick Stack Bar */}
          <div className="h-[22px] rounded-[4px] bg-surface-raised overflow-hidden flex text-overline font-mono text-white shadow-xs">
            <div
              style={{ width: "22.4%" }}
              className="h-full bg-danger flex items-center justify-center truncate px-1"
              title="Entities (22.4%)"
            >
              Entities (22.4%)
            </div>
            <div
              style={{ width: "18.2%" }}
              className="h-full bg-warning flex items-center justify-center truncate px-1"
              title="Mods (18.2%)"
            >
              Mods (18.2%)
            </div>
            <div
              style={{ width: "12%" }}
              className="h-full bg-primary flex items-center justify-center truncate px-1"
              title="Redstone (12%)"
            >
              Redstone
            </div>
            <div
              style={{ width: "8%" }}
              className="h-full bg-info flex items-center justify-center truncate px-0.5"
              title="I / O (8%)"
            >
              I/O
            </div>
            <div
              style={{ width: "39.4%" }}
              className="h-full bg-success flex items-center justify-center truncate px-1"
              title="Idle Headroom (38.9%)"
            >
              Idle Headroom (38.9%)
            </div>
          </div>

          {/* Dimension Breakdown Rows */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Overworld (world) Dimension Tick</span>
              <span className="text-heading font-medium">
                {dims.overworld.mspt.toFixed(1)} ms / tick ({dims.overworld.loadPct}% load)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Nether (world_nether) Dimension Tick</span>
              <span className="text-heading font-medium">
                {dims.nether.mspt.toFixed(1)} ms / tick ({dims.nether.loadPct}% load)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">The End (world_the_end) Dimension Tick</span>
              <span className="text-heading font-medium">
                {dims.end.mspt.toFixed(1)} ms / tick ({dims.end.loadPct}% load)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Packet Network Dispatch Rate</span>
              <span className="text-heading font-medium">142 packets / sec · 18.4 KB/s</span>
            </div>
          </div>
        </div>

        {/* Card Right: JVM Garbage Collection & Heap Pools */}
        <div className="bg-surface border border-border rounded-[8px] p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-overline text-heading uppercase">
              JVM GARBAGE COLLECTION & HEAP POOLS
            </span>
            <span className="text-xs font-mono text-primary">Collector: G1GC (-XX:+UseG1GC)</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Eden Space (Young Generation)</span>
              <span className="text-heading font-medium">1.45 GB / 1.80 GB (80.5%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Survivor Space</span>
              <span className="text-heading font-medium">128 MB / 256 MB (50.0%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tenured (Old Generation Pool)</span>
              <span className="text-heading font-medium">5.99 GB / 5.94 GB (Cleaned)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Metaspace (Class Metadata)</span>
              <span className="text-heading font-medium">184 MB / Unlimited</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">GC Pause Frequency & Max Stall</span>
              <span className="text-heading font-medium">1.2 pauses / min · 18.2 ms max pause</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Direct ByteBuffers / Native Memory</span>
              <span className="text-heading font-medium">412 MB allocated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spark Profiler Sampler Table Card (Penpot h: 220, r: 8, stroke: #e1e6ed) */}
      <div className="bg-surface border border-border rounded-[8px] p-3.5 sm:p-4 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <span className="text-overline text-heading uppercase">
            LIVE SPARK PROFILER METHOD SAMPLING (TOP EXECUTION HOTSPOTS)
          </span>
          <span className="text-xs font-mono text-muted-foreground">
            Sample count: 18,402 ticks · Sampling Interval: 10ms · Engine: Spark 1.10.53
          </span>
        </div>

        <div className="space-y-1 font-mono text-xs">
          {SPARK_HOTSPOTS.map((hotspot) => (
            <div
              key={hotspot.rank}
              className={cn(
                "h-6 px-2 rounded-[4px] flex items-center gap-3 transition-colors",
                hotspot.isAltBg ? "bg-surface-raised" : "bg-surface"
              )}
            >
              <span className="text-xs text-muted-foreground w-4 shrink-0 font-medium">
                {hotspot.rank}
              </span>
              <span
                className={cn("text-xs font-semibold w-12 shrink-0 font-mono", hotspot.pctColor)}
              >
                {hotspot.pct}
              </span>
              <span className="text-xs text-muted-foreground w-28 shrink-0 font-medium">
                {hotspot.category}
              </span>
              <span className="text-xs text-heading truncate flex-1 min-w-0 font-mono">
                {hotspot.method}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
