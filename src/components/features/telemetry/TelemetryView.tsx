"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { ProgressGauge } from "@/components/ui/ProgressGauge";
import { MOCK_TELEMETRY, type MockTelemetryData } from "@/lib/mockData";

export interface TelemetryViewProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TelemetryView({ onRefresh, isRefreshing = false }: TelemetryViewProps) {
  const [telemetry] = useState<MockTelemetryData>(MOCK_TELEMETRY);
  const [isProfiling, setIsProfiling] = useState(false);

  const handleRunSpark = () => {
    setIsProfiling(true);
    setTimeout(() => {
      setIsProfiling(false);
      alert("Spark profiler report generated: https://spark.lucko.me/sample-report-id");
    }, 1500);
  };

  return (
    <div className="space-y-6">
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

      {/* Host Hardware & Engine Banner */}
      <div className="bg-surface border border-border rounded-xl p-4 shadow-xs">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Dedicated Node Specifications & Runtime
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Host Processor</div>
            <div className="font-semibold text-heading mt-0.5">{telemetry.hostCpu}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Physical Memory & Storage</div>
            <div className="font-semibold text-heading mt-0.5">
              {telemetry.hostRam} · NVMe RAID1
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Paper Engine & Build</div>
            <div className="font-semibold text-heading mt-0.5">{telemetry.paperBuild}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Continuous Server Uptime</div>
            <div className="font-semibold text-emerald-500 font-mono mt-0.5">
              {telemetry.uptime}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Container CPU Load
          </div>
          <div className="text-2xl font-semibold text-heading mt-2">
            {telemetry.cpuPercent}%
          </div>
          <div className="mt-3">
            <ProgressGauge value={telemetry.cpuPercent} tone="auto" />
            <div className="text-[10px] text-muted-foreground text-right mt-1">
              Threshold budget 100%
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            JVM Heap Allocation
          </div>
          <div className="text-2xl font-semibold text-heading mt-2">
            {(telemetry.heapUsedMb / 1024).toFixed(1)} GB / {(telemetry.heapMaxMb / 1024).toFixed(1)} GB
          </div>
          <div className="mt-3">
            <ProgressGauge
              value={(telemetry.heapUsedMb / telemetry.heapMaxMb) * 100}
              tone="primary"
            />
            <div className="text-[10px] text-muted-foreground text-right mt-1">
              50% committed memory
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Engine Tick Rate
          </div>
          <div className="text-2xl font-semibold text-emerald-500 mt-2">
            {telemetry.tps} TPS
          </div>
          <div className="mt-3">
            <ProgressGauge value={(telemetry.tps / 20) * 100} tone="success" />
            <div className="text-[10px] text-muted-foreground text-right mt-1">
              Target 20.0 TPS (99% health)
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Average MSPT
          </div>
          <div className="text-2xl font-semibold text-heading mt-2">
            {telemetry.mspt} ms
          </div>
          <div className="mt-3">
            <ProgressGauge value={(telemetry.mspt / 50) * 100} tone="auto" />
            <div className="text-[10px] text-muted-foreground text-right mt-1">
              Budget 50.0 ms per tick
            </div>
          </div>
        </div>
      </div>

      {/* Deep Telemetry Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* MSPT Percentiles */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="text-sm font-semibold text-heading">Tick MSPT Distribution Percentiles</div>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">50th Percentile (Median)</span>
                <span className="font-mono font-semibold text-heading">
                  {telemetry.msptPercentiles.p50} ms
                </span>
              </div>
              <ProgressGauge value={(telemetry.msptPercentiles.p50 / 50) * 100} tone="success" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">95th Percentile</span>
                <span className="font-mono font-semibold text-heading">
                  {telemetry.msptPercentiles.p95} ms
                </span>
              </div>
              <ProgressGauge value={(telemetry.msptPercentiles.p95 / 50) * 100} tone="auto" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">99th Percentile (Worst Spikes)</span>
                <span className="font-mono font-semibold text-heading">
                  {telemetry.msptPercentiles.p99} ms
                </span>
              </div>
              <ProgressGauge value={(telemetry.msptPercentiles.p99 / 50) * 100} tone="danger" />
            </div>
          </div>
        </div>

        {/* JVM GC Metrics */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs space-y-3">
          <div className="text-sm font-semibold text-heading">JVM Garbage Collector Statistics</div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-surface-raised rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Young Gen GC Pauses</div>
              <div className="text-lg font-semibold text-heading mt-1">
                {telemetry.gcPauses.youngCount.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Total pause time: {telemetry.gcPauses.youngTimeMs} ms
              </div>
            </div>
            <div className="p-3 bg-surface-raised rounded-lg border border-border">
              <div className="text-xs text-muted-foreground">Old Gen (Major) Pauses</div>
              <div className="text-lg font-semibold text-heading mt-1">
                {telemetry.gcPauses.oldCount}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Total pause time: {telemetry.gcPauses.oldTimeMs} ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spark Profiler Sampler Table Card */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-border flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Spark Profiler Top Tick Consumers
          </div>
          <span className="text-xs font-mono text-muted-foreground">Sampling Window: 15 min</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[420px]">Method / Subsystem</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Self Time</TableHead>
              <TableHead className="text-right">% of Tick</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {telemetry.profilerSamples.map((sample) => (
              <TableRow key={sample.method}>
                <TableCell>
                  <span className="font-mono text-xs font-medium text-heading">
                    {sample.method}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface-raised border border-border text-subtle-foreground">
                    {sample.category}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-xs text-heading">
                    {sample.selfTimeMs} ms
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-2 justify-end">
                    <span className="font-mono text-xs font-semibold text-heading">
                      {sample.percent}%
                    </span>
                    <div className="w-16">
                      <ProgressGauge value={sample.percent} tone="primary" size="sm" />
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
