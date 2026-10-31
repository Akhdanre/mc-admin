import { describe, expect, it, spyOn } from "bun:test";
import { getTelemetryData } from "@/server/telemetry";
import * as rcon from "@/server/rcon";

describe("Telemetry Service", () => {
  it("fetches host and minecraft engine telemetry data", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockImplementation(async (cmd) => {
      if (cmd.includes("forge tps")) {
        return (
          "Dim minecraft:overworld (minecraft:overworld): Mean tick time: 1.996 ms. Mean TPS: 20.000\n" +
          "Dim minecraft:the_nether (minecraft:the_nether): Mean tick time: 0.019 ms. Mean TPS: 20.000\n" +
          "Dim minecraft:the_end (minecraft:the_end): Mean tick time: 0.005 ms. Mean TPS: 20.000\n" +
          "Overall: Mean tick time: 2.118 ms. Mean TPS: 20.000"
        );
      }
      return "";
    });

    const data = await getTelemetryData(true);

    expect(data).toBeDefined();
    // Host specs
    expect(typeof data.host.os).toBe("string");
    expect(typeof data.host.kernel).toBe("string");
    expect(typeof data.host.cpuModel).toBe("string");
    expect(data.host.cores).toBeGreaterThanOrEqual(1);
    expect(data.host.threads).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(data.host.loadAvg)).toBe(true);
    expect(data.host.loadAvg.length).toBe(3);

    // Metrics
    expect(data.metrics.tps).toBe(20.0);
    expect(data.metrics.mspt).toBeCloseTo(2.1, 1);
    expect(data.metrics.cpuUsagePct).toBeGreaterThanOrEqual(0);
    expect(data.metrics.cpuUsagePct).toBeLessThanOrEqual(100);

    // JVM & RAM
    expect(data.metrics.jvm.allocatedBytes).toBeGreaterThan(0);
    expect(data.metrics.ram.totalBytes).toBeGreaterThan(0);
    expect(data.metrics.ram.usedPct).toBeGreaterThanOrEqual(0);
    expect(data.metrics.ram.usedPct).toBeLessThanOrEqual(100);

    // Disk
    expect(data.metrics.disk.totalBytes).toBeGreaterThan(0);
    expect(data.metrics.disk.usedPct).toBeGreaterThanOrEqual(0);

    // Dimensions
    expect(data.dimensions.overworld.tps).toBe(20.0);
    expect(data.dimensions.overworld.mspt).toBe(1.996);
    expect(data.dimensions.nether.tps).toBe(20.0);
    expect(data.dimensions.end.tps).toBe(20.0);

    // Spark hotspots
    expect(Array.isArray(data.sparkHotspots)).toBe(true);
    expect(data.sparkHotspots.length).toBeGreaterThan(0);

    spy.mockRestore();
  });

  it("handles offline RCON gracefully with default 20 TPS", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockRejectedValue(
      new Error("Connection refused")
    );

    const data = await getTelemetryData(true);
    expect(data).toBeDefined();
    expect(data.metrics.tps).toBe(20.0);
    expect(data.metrics.mspt).toBe(2.1);
    expect(data.dimensions.overworld.tps).toBe(20.0);

    spy.mockRestore();
  });
});
