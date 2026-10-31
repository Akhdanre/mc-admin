"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
    pctColor: "text-[#dc2626]",
    category: "[MOD LOGIC]",
    method: "com.majruszsdifficulty.undeadarmy.UndeadArmy.tick()",
    isAltBg: false,
  },
  {
    rank: "#2",
    pct: "14.12%",
    pctColor: "text-[#d97706]",
    category: "[MOB AI ENGINE]",
    method: "net.minecraft.world.entity.ai.goal.GoalSelector.tick()",
    isAltBg: true,
  },
  {
    rank: "#3",
    pct: "11.85%",
    pctColor: "text-[#2656c8]",
    category: "[CHUNK TICK]",
    method: "net.minecraft.server.level.ServerChunkCache.tickChunks()",
    isAltBg: false,
  },
  {
    rank: "#4",
    pct: "8.45%",
    pctColor: "text-[#4f5b6e]",
    category: "[BLOCK PHYSICS]",
    method: "net.minecraft.world.level.block.piston.PistonBaseBlock.checkSite()",
    isAltBg: true,
  },
  {
    rank: "#5",
    pct: "6.30%",
    pctColor: "text-[#4f5b6e]",
    category: "[DYNMAP TILE I/O]",
    method: "org.dynmap.forge.DynmapPlugin.renderQueue()",
    isAltBg: false,
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
    <div className="space-y-3.5">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-2.5 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-subtle-foreground hover:text-foreground cursor-pointer">
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
          <p className="text-xs text-[#4f5b6e] dark:text-muted-foreground mt-0.5 font-mono">
            <span className="text-[#10b981] font-bold">●</span> LIVE TELEMETRY · 1s Polling · Intel i5-7200U · 15.5 GB RAM · Docker Container mc-server
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 px-3 rounded-[6px] border border-[#cbd3de] dark:border-border bg-white dark:bg-surface text-xs font-medium text-heading hover:bg-surface-raised cursor-pointer shadow-xs"
          >
            Poll: 1s (Live) ▾
          </button>
          <button
            type="button"
            onClick={handleRunSpark}
            disabled={isProfiling}
            className="h-8 px-4 rounded-[6px] bg-[#2656c8] hover:bg-[#1f45a3] text-white text-xs font-medium cursor-pointer shadow-xs"
          >
            {isProfiling ? "Sampling Ticks..." : "Generate Spark Profile (30s)"}
          </button>
        </div>
      </div>

      {/* Host Hardware & Engine Banner (Penpot h: 60, r: 8, stroke: #e1e6ed) */}
      <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3 sm:px-4.5 sm:py-3 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-xs font-semibold text-[#161b24] dark:text-heading">
            Host OS: Debian GNU/Linux 12 (bookworm) · Kernel 6.1.0-53-amd64
          </div>
          <div className="text-[11px] text-[#6b778a] dark:text-muted-foreground font-mono">
            CPU: Intel Core i5-7200U @ 2.50GHz (2 Cores, 4 Threads) · Load Avg: 0.42, 0.38, 0.35
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center h-6 px-2.5 rounded-[4px] text-xs font-medium bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0] font-mono">
            ● 20.0 TPS (Stable)
          </span>
          <span className="inline-flex items-center h-6 px-2.5 rounded-[4px] text-xs font-medium bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] font-mono">
            MSPT: 24.2 ms
          </span>
        </div>
      </div>

      {/* Telemetry 4-Metric Grid (Penpot h: 104, r: 8, stroke: #e1e6ed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: CONTAINER CPU LOAD */}
        <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-[#6b778a] dark:text-muted-foreground uppercase tracking-wider">
            CONTAINER CPU LOAD
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#161b24] dark:text-heading font-mono">
            12.4% Utilized
          </div>
          <div>
            <div className="h-1 w-full bg-[#f1f4f8] dark:bg-surface-raised rounded-[2px] overflow-hidden">
              <div style={{ width: "25%" }} className="h-full bg-[#2656c8] rounded-[2px]" />
            </div>
            <div className="text-[11px] text-[#8c9bae] dark:text-muted-foreground mt-1 font-mono">
              Intel i5-7200U · 4 Threads active
            </div>
          </div>
        </div>

        {/* Card 2: JVM HEAP ALLOCATION */}
        <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-[#6b778a] dark:text-muted-foreground uppercase tracking-wider">
            JVM HEAP ALLOCATION
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#161b24] dark:text-heading font-mono">
            7.57 GB / 8.00 GB
          </div>
          <div>
            <div className="h-1 w-full bg-[#f1f4f8] dark:bg-surface-raised rounded-[2px] overflow-hidden">
              <div style={{ width: "94%" }} className="h-full bg-[#d97706] rounded-[2px]" />
            </div>
            <div className="text-[11px] text-[#8c9bae] dark:text-muted-foreground mt-1 font-mono">
              G1GC Collector · 18ms avg pause
            </div>
          </div>
        </div>

        {/* Card 3: HOST PHYSICAL RAM */}
        <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-[#6b778a] dark:text-muted-foreground uppercase tracking-wider">
            HOST PHYSICAL RAM
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#161b24] dark:text-heading font-mono">
            8.2 GB / 15.5 GB
          </div>
          <div>
            <div className="h-1 w-full bg-[#f1f4f8] dark:bg-surface-raised rounded-[2px] overflow-hidden">
              <div style={{ width: "52%" }} className="h-full bg-[#15803d] rounded-[2px]" />
            </div>
            <div className="text-[11px] text-[#8c9bae] dark:text-muted-foreground mt-1 font-mono">
              7.4 GB OS Cache · 7.3 GB Available
            </div>
          </div>
        </div>

        {/* Card 4: DISK NVME FOOTPRINT */}
        <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3.5 shadow-xs flex flex-col justify-between h-[104px]">
          <div className="text-[11px] font-semibold text-[#6b778a] dark:text-muted-foreground uppercase tracking-wider">
            DISK NVME FOOTPRINT
          </div>
          <div className="text-xl sm:text-2xl font-semibold text-[#161b24] dark:text-heading font-mono">
            48 GB / 233 GB
          </div>
          <div>
            <div className="h-1 w-full bg-[#f1f4f8] dark:bg-surface-raised rounded-[2px] overflow-hidden">
              <div style={{ width: "21%" }} className="h-full bg-[#15803d] rounded-[2px]" />
            </div>
            <div className="text-[11px] text-[#8c9bae] dark:text-muted-foreground mt-1 font-mono">
              174 GB Free · /dev/sda1 (ext4)
            </div>
          </div>
        </div>
      </div>

      {/* Deep Telemetry Row 2 (Penpot h: 270, 2 equal columns w: 540) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* Card Left: MSPT & Engine Distribution */}
        <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#161b24] dark:text-heading uppercase tracking-wide">
              TICK TIME ENGINE DISTRIBUTION (MSPT)
            </span>
            <span className="text-[11px] font-mono text-[#15803d]">
              Target: &lt; 50.0 ms (20 TPS)
            </span>
          </div>

          {/* Tick Stack Bar (Penpot exact 5 segments: Entities 22.4%, Mods 18.2%, Redstone 12%, I/O 8%, Idle 38.9%) */}
          <div className="h-[22px] rounded-[4px] bg-[#f1f4f8] dark:bg-surface-raised overflow-hidden flex text-[10px] font-mono font-medium text-white shadow-xs">
            <div style={{ width: "22.4%" }} className="h-full bg-[#dc2626] flex items-center justify-center truncate px-1" title="Entities (22.4%)">
              Entities (22.4%)
            </div>
            <div style={{ width: "18.2%" }} className="h-full bg-[#d97706] flex items-center justify-center truncate px-1" title="Mods (18.2%)">
              Mods (18.2%)
            </div>
            <div style={{ width: "12%" }} className="h-full bg-[#2656c8] flex items-center justify-center truncate px-1" title="Redstone (12%)">
              Redstone
            </div>
            <div style={{ width: "8%" }} className="h-full bg-[#7c3aed] flex items-center justify-center truncate px-0.5" title="I / O (8%)">
              I/O
            </div>
            <div style={{ width: "39.4%" }} className="h-full bg-[#15803d] flex items-center justify-center truncate px-1" title="Idle Headroom (38.9%)">
              Idle Headroom (38.9%)
            </div>
          </div>

          {/* Dimension Breakdown Rows */}
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Overworld (world) Dimension Tick</span>
              <span className="text-[#161b24] dark:text-heading font-medium">14.8 ms / tick (61% load)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Nether (world_nether) Dimension Tick</span>
              <span className="text-[#161b24] dark:text-heading font-medium">5.2 ms / tick (21% load)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">The End (world_the_end) Dimension Tick</span>
              <span className="text-[#161b24] dark:text-heading font-medium">4.2 ms / tick (18% load)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Packet Network Dispatch Rate</span>
              <span className="text-[#161b24] dark:text-heading font-medium">142 packets / sec · 18.4 KB/s</span>
            </div>
          </div>
        </div>

        {/* Card Right: JVM Garbage Collection & Heap Pools */}
        <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#161b24] dark:text-heading uppercase tracking-wide">
              JVM GARBAGE COLLECTION & HEAP POOLS
            </span>
            <span className="text-[11px] font-mono text-[#2656c8]">
              Collector: G1GC (-XX:+UseG1GC)
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Eden Space (Young Generation)</span>
              <span className="text-[#161b24] dark:text-heading font-medium">1.45 GB / 1.80 GB (80.5%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Survivor Space</span>
              <span className="text-[#161b24] dark:text-heading font-medium">128 MB / 256 MB (50.0%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Tenured (Old Generation Pool)</span>
              <span className="text-[#161b24] dark:text-heading font-medium">5.99 GB / 5.94 GB (Cleaned)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Metaspace (Class Metadata)</span>
              <span className="text-[#161b24] dark:text-heading font-medium">184 MB / Unlimited</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">GC Pause Frequency & Max Stall</span>
              <span className="text-[#161b24] dark:text-heading font-medium">1.2 pauses / min · 18.2 ms max pause</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#4f5b6e] dark:text-muted-foreground">Direct ByteBuffers / Native Memory</span>
              <span className="text-[#161b24] dark:text-heading font-medium">412 MB allocated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Spark Profiler Sampler Table Card (Penpot h: 220, r: 8, stroke: #e1e6ed) */}
      <div className="bg-white dark:bg-surface border border-[#e1e6ed] dark:border-border rounded-[8px] p-3.5 sm:p-4 shadow-xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
          <span className="text-xs font-bold text-[#161b24] dark:text-heading uppercase tracking-wide">
            LIVE SPARK PROFILER METHOD SAMPLING (TOP EXECUTION HOTSPOTS)
          </span>
          <span className="text-[11px] font-mono text-[#6b778a] dark:text-muted-foreground">
            Sample count: 18,402 ticks · Sampling Interval: 10ms · Engine: Spark 1.10.53
          </span>
        </div>

        <div className="space-y-1 font-mono text-xs">
          {SPARK_HOTSPOTS.map((hotspot) => (
            <div
              key={hotspot.rank}
              className={cn(
                "h-6 px-2 rounded-[4px] flex items-center gap-3 transition-colors",
                hotspot.isAltBg ? "bg-[#f8fafc] dark:bg-surface-raised" : "bg-white dark:bg-surface"
              )}
            >
              <span className="text-[11px] text-[#8c9bae] w-4 shrink-0 font-medium">
                {hotspot.rank}
              </span>
              <span className={cn("text-xs font-semibold w-12 shrink-0", hotspot.pctColor)}>
                {hotspot.pct}
              </span>
              <span className="text-[11px] text-[#6b778a] dark:text-muted-foreground w-28 shrink-0 font-medium">
                {hotspot.category}
              </span>
              <span className="text-xs text-[#161b24] dark:text-heading truncate flex-1 min-w-0 font-sans">
                {hotspot.method}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
