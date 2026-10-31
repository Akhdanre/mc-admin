"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProgressGauge } from "@/components/ui/ProgressGauge";
import { cn } from "@/lib/cn";

export interface TelemetryViewProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface SparkHotspot {
  rank: string;
  pct: string;
  category: string;
  method: string;
}

const SPARK_HOTSPOTS: SparkHotspot[] = [
  {
    rank: "#1",
    pct: "18.24%",
    category: "[MOD LOGIC]",
    method: "com.majruszsdifficulty.undeadarmy.UndeadArmy.tick()",
  },
  {
    rank: "#2",
    pct: "14.12%",
    category: "[MOB AI ENGINE]",
    method: "net.minecraft.world.entity.ai.goal.GoalSelector.tick()",
  },
  {
    rank: "#3",
    pct: "11.85%",
    category: "[CHUNK TICK]",
    method: "net.minecraft.server.level.ServerChunkCache.tickChunks()",
  },
  {
    rank: "#4",
    pct: "8.45%",
    category: "[BLOCK PHYSICS]",
    method: "net.minecraft.world.level.block.piston.PistonBaseBlock.checkSite()",
  },
  {
    rank: "#5",
    pct: "6.30%",
    category: "[DYNMAP TILE I/O]",
    method: "org.dynmap.forge.DynmapPlugin.renderQueue()",
  },
];

export function TelemetryView({ onRefresh, isRefreshing = false }: TelemetryViewProps) {
  const [isProfiling, setIsProfiling] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleRunSpark = () => {
    setIsProfiling(true);
    setActionNotice("Sampling 18,402 ticks across server threads...");
    setTimeout(() => {
      setIsProfiling(false);
      setActionNotice("Spark profiler report generated: spark.lucko.me/sample-report-id");
      setTimeout(() => setActionNotice(null), 4000);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-subtle-foreground hover:text-foreground cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            System Telemetry & Performance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-emerald-500 font-bold">●</span> LIVE TELEMETRY · 1s Polling · Intel i5-7200U · 15.5 GB RAM · Docker Container mc-server
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs h-8 px-3"
          >
            Poll: 1s (Live) ▾
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleRunSpark}
            disabled={isProfiling}
            className="text-xs h-8 px-4 font-medium"
          >
            {isProfiling ? "Sampling Ticks..." : "Generate Spark Profile (30s)"}
          </Button>
        </div>
      </div>

      {/* Host Hardware & Engine Banner (Penpot exact) */}
      <div className="bg-surface border border-border rounded-xl p-3 sm:px-4 sm:py-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5 text-xs">
          <div className="font-semibold text-heading">
            Host OS: Debian GNU/Linux 12 (bookworm) · Kernel 6.1.0-53-amd64
          </div>
          <div className="text-muted-foreground font-mono text-[11px]">
            CPU: Intel Core i5-7200U @ 2.50GHz (2 Cores, 4 Threads) · Load Avg: 0.42, 0.38, 0.35
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            ● 20.0 TPS (Stable)
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
            MSPT: 24.2 ms
          </span>
        </div>
      </div>

      {/* Telemetry 4-Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: CONTAINER CPU LOAD */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            CONTAINER CPU LOAD
          </div>
          <div className="text-2xl font-semibold text-heading font-mono">
            12.4% Utilized
          </div>
          <div>
            <ProgressGauge value={12.4} tone="auto" />
            <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
              Intel i5-7200U · 4 Threads active
            </div>
          </div>
        </div>

        {/* Card 2: JVM HEAP ALLOCATION */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            JVM HEAP ALLOCATION
          </div>
          <div className="text-2xl font-semibold text-heading font-mono">
            7.57 GB / 8.00 GB
          </div>
          <div>
            <ProgressGauge value={94.6} tone="danger" />
            <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
              G1GC Collector · 18ms avg pause
            </div>
          </div>
        </div>

        {/* Card 3: HOST PHYSICAL RAM */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            HOST PHYSICAL RAM
          </div>
          <div className="text-2xl font-semibold text-heading font-mono">
            8.2 GB / 15.5 GB
          </div>
          <div>
            <ProgressGauge value={52.9} tone="auto" />
            <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
              7.4 GB OS Cache · 7.3 GB Available
            </div>
          </div>
        </div>

        {/* Card 4: DISK NVME FOOTPRINT */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-2">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            DISK NVME FOOTPRINT
          </div>
          <div className="text-2xl font-semibold text-heading font-mono">
            48 GB / 233 GB
          </div>
          <div>
            <ProgressGauge value={20.6} tone="auto" />
            <div className="text-[11px] text-muted-foreground mt-1.5 font-mono">
              174 GB Free · /dev/sda1 (ext4)
            </div>
          </div>
        </div>
      </div>

      {/* Deep Telemetry Row 2 (2 Large Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card Left: MSPT & Engine Distribution */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-heading">
              TICK TIME ENGINE DISTRIBUTION (MSPT)
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              Target: &lt; 50.0 ms (20 TPS)
            </span>
          </div>

          {/* Stacked Tick Bar */}
          <div className="h-5 rounded-md overflow-hidden flex text-[10px] font-mono font-bold text-white shadow-xs">
            <div style={{ width: "22.4%" }} className="bg-amber-500 flex items-center justify-center truncate px-1" title="Entities 22.4%">
              Entities (22.4%)
            </div>
            <div style={{ width: "18.2%" }} className="bg-purple-600 flex items-center justify-center truncate px-1" title="Mods 18.2%">
              Mods (18.2%)
            </div>
            <div style={{ width: "20.5%" }} className="bg-rose-500 flex items-center justify-center truncate px-1" title="Redstone">
              Redstone
            </div>
            <div style={{ width: "38.9%" }} className="bg-emerald-500/80 text-emerald-950 flex items-center justify-center truncate px-1" title="Idle Headroom 38.9%">
              Idle Headroom (38.9%)
            </div>
          </div>

          {/* Engine Dimension Breakdown */}
          <div className="divide-y divide-border/40 text-xs font-mono space-y-2 pt-1">
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">Overworld (world) Dimension Tick</span>
              <span className="text-muted-foreground">14.8 ms / tick (61% load)</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">Nether (world_nether) Dimension Tick</span>
              <span className="text-muted-foreground">5.2 ms / tick (21% load)</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">The End (world_the_end) Dimension Tick</span>
              <span className="text-muted-foreground">4.2 ms / tick (18% load)</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">Packet Network Dispatch Rate</span>
              <span className="text-muted-foreground">142 packets / sec · 18.4 KB/s</span>
            </div>
          </div>
        </div>

        {/* Card Right: JVM Garbage Collection & Heap Pools */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-heading">
              JVM GARBAGE COLLECTION & HEAP POOLS
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Collector: G1GC (-XX:+UseG1GC)
            </span>
          </div>

          <div className="divide-y divide-border/40 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between pt-1">
              <span className="text-heading">Eden Space (Young Generation)</span>
              <span className="text-amber-500 font-semibold">1.45 GB / 1.80 GB (80.5%)</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">Survivor Space</span>
              <span className="text-muted-foreground">128 MB / 256 MB (50.0%)</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">Tenured (Old Generation Pool)</span>
              <span className="text-emerald-500 font-semibold">5.99 GB / 5.94 GB (Cleaned)</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">Metaspace (Class Metadata)</span>
              <span className="text-muted-foreground">184 MB / Unlimited</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">GC Pause Frequency & Max Stall</span>
              <span className="text-muted-foreground">1.2 pauses / min · 18.2 ms max pause</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-heading">Direct ByteBuffers / Native Memory</span>
              <span className="text-muted-foreground">412 MB allocated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spark Profiler Sampler Table Card (Penpot exact) */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <span className="text-xs font-bold text-heading uppercase tracking-wider">
            LIVE SPARK PROFILER METHOD SAMPLING (TOP EXECUTION HOTSPOTS)
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            Sample count: 18,402 ticks · Sampling Interval: 10ms · Engine: Spark 1.10.53
          </span>
        </div>

        <div className="divide-y divide-border/40 p-2 sm:p-3 space-y-1.5 font-mono text-xs">
          {SPARK_HOTSPOTS.map((hotspot) => (
            <div
              key={hotspot.rank}
              className="flex items-center gap-3 py-1.5 px-2 hover:bg-surface-raised/50 rounded transition-colors"
            >
              <span className="font-bold text-muted-foreground w-6 shrink-0">
                {hotspot.rank}
              </span>
              <span className="font-bold text-rose-500 w-16 shrink-0">
                {hotspot.pct}
              </span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-surface-raised border border-border text-heading shrink-0 font-semibold">
                {hotspot.category}
              </span>
              <span className="text-muted-foreground truncate flex-1 min-w-0">
                {hotspot.method}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
