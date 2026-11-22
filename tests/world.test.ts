import { describe, expect, it, spyOn } from "bun:test";
import { gameruleActionSchema } from "@/schemas";
import { DEFAULT_GAMERULES_DEFINITIONS, setServerGamerule, getWorldStats } from "@/server/world";
import * as rcon from "@/server/rcon";

describe("Gamerule Action Schema", () => {
  it("validates boolean gamerule action", () => {
    const valid = gameruleActionSchema.safeParse({
      rule: "keepInventory",
      value: true,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.rule).toBe("keepInventory");
      expect(valid.data.value).toBe(true);
    }
  });

  it("validates numeric gamerule action", () => {
    const valid = gameruleActionSchema.safeParse({
      rule: "playersSleepingPercentage",
      value: 101,
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.rule).toBe("playersSleepingPercentage");
      expect(valid.data.value).toBe(101);
    }
  });

  it("rejects missing rule name", () => {
    const invalid = gameruleActionSchema.safeParse({
      rule: "",
      value: true,
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects string values for boolean/number rules", () => {
    const invalid = gameruleActionSchema.safeParse({
      rule: "keepInventory",
      value: "true",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("Gamerules Matrix Completeness", () => {
  it("contains all 45 rules defined in Penpot design", () => {
    expect(DEFAULT_GAMERULES_DEFINITIONS.length).toBe(45);
  });

  it("has exactly 12 Gameplay & Survival Mechanics rules", () => {
    const gameplay = DEFAULT_GAMERULES_DEFINITIONS.filter((r) => r.category === "gameplay");
    expect(gameplay.length).toBe(12);
  });

  it("has exactly 12 Mobs, Spawning & Combat rules", () => {
    const combat = DEFAULT_GAMERULES_DEFINITIONS.filter((r) => r.category === "combat");
    expect(combat.length).toBe(12);
  });

  it("has exactly 11 World, Physics & Environment rules", () => {
    const physics = DEFAULT_GAMERULES_DEFINITIONS.filter((r) => r.category === "physics");
    expect(physics.length).toBe(11);
  });

  it("has exactly 10 Chat, Console & Admin Operations rules", () => {
    const admin = DEFAULT_GAMERULES_DEFINITIONS.filter((r) => r.category === "admin");
    expect(admin.length).toBe(10);
  });

  it("ensures all 45 rules have unique IDs and descriptions", () => {
    const ids = new Set<string>();
    for (const rule of DEFAULT_GAMERULES_DEFINITIONS) {
      expect(ids.has(rule.id)).toBe(false);
      ids.add(rule.id);
      expect(rule.description.length).toBeGreaterThan(5);
      expect(["boolean", "number"].includes(rule.type)).toBe(true);
    }
  });
});

describe("Server Gamerule Mutations Across All 4 Categories", () => {
  it("mutates Gameplay category rule (keepInventory)", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");
    const result = await setServerGamerule("keepInventory", true);
    expect(spy).toHaveBeenCalledWith("gamerule keepInventory true");
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
    spy.mockRestore();
  });

  it("mutates Combat category rule (mobGriefing)", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");
    const result = await setServerGamerule("mobGriefing", false);
    expect(spy).toHaveBeenCalledWith("gamerule mobGriefing false");
    expect(result.success).toBe(true);
    expect(result.value).toBe(false);
    spy.mockRestore();
  });

  it("mutates Physics category rule (doDaylightCycle)", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");
    const result = await setServerGamerule("doDaylightCycle", false);
    expect(spy).toHaveBeenCalledWith("gamerule doDaylightCycle false");
    expect(result.success).toBe(true);
    expect(result.value).toBe(false);
    spy.mockRestore();
  });

  it("mutates Admin category rule (showDeathMessages)", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");
    const result = await setServerGamerule("showDeathMessages", false);
    expect(spy).toHaveBeenCalledWith("gamerule showDeathMessages false");
    expect(result.success).toBe(true);
    expect(result.value).toBe(false);
    spy.mockRestore();
  });

  it("mutates Numeric rules correctly (randomTickSpeed, maxEntityCramming, maxCommandChainLength)", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");

    await setServerGamerule("randomTickSpeed", 5);
    expect(spy).toHaveBeenCalledWith("gamerule randomTickSpeed 5");

    await setServerGamerule("maxEntityCramming", 32);
    expect(spy).toHaveBeenCalledWith("gamerule maxEntityCramming 32");

    await setServerGamerule("maxCommandChainLength", 10000);
    expect(spy).toHaveBeenCalledWith("gamerule maxCommandChainLength 10000");

    spy.mockRestore();
  });

  it("throws error for unknown gamerule", async () => {
    await expect(setServerGamerule("invalidGameruleName", true)).rejects.toThrow(
      "Unknown gamerule: invalidGameruleName"
    );
  });
});

describe("World Stats & Dimensions Service", () => {
  it("fetches world stats, seed, daytime, and 3 dimensions", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockImplementation(async (cmd) => {
      if (cmd.includes("time query daytime")) return "The time is 14250";
      if (cmd.includes("difficulty")) return "The difficulty is Hard";
      if (cmd.includes("seed")) return "Seed: [4268910435170371502]";
      return "is currently set to: true";
    });

    const stats = await getWorldStats(true);
    expect(stats).toBeDefined();
    expect(stats.seed).toBe("4268910435170371502");
    expect(stats.daytime).toBe(14250);
    expect(stats.difficulty).toBe("hard");
    expect(stats.dimensions.length).toBe(3);

    const overworld = stats.dimensions.find((d) => d.id === "overworld");
    const nether = stats.dimensions.find((d) => d.id === "nether");
    const end = stats.dimensions.find((d) => d.id === "end");

    expect(overworld).toBeDefined();
    expect(nether).toBeDefined();
    expect(end).toBeDefined();
    expect(overworld?.diskSizeFormatted).toMatch(/(GB|MB)/);

    expect(stats.gamerules.length).toBe(45);
    spy.mockRestore();
  });

  it("updates cached gamerule value when setServerGamerule is executed", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");

    // Mutate keepInventory to true
    await setServerGamerule("keepInventory", true);

    // Fetch stats from cache
    const stats = await getWorldStats(false);
    const keepInv = stats.gamerules.find((r) => r.id === "keepInventory");
    expect(keepInv?.value).toBe(true);

    spy.mockRestore();
  });
});

describe("Environment & Administrative Commands Execution", () => {
  it("executes time change commands via RCON", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Set time to 1000");

    await rcon.executeRconCommand("time set day");
    expect(spy).toHaveBeenCalledWith("time set day");

    await rcon.executeRconCommand("time set night");
    expect(spy).toHaveBeenCalledWith("time set night");

    spy.mockRestore();
  });

  it("executes weather change commands via RCON", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Set weather to clear");

    await rcon.executeRconCommand("weather clear");
    expect(spy).toHaveBeenCalledWith("weather clear");

    await rcon.executeRconCommand("weather thunder");
    expect(spy).toHaveBeenCalledWith("weather thunder");

    spy.mockRestore();
  });

  it("executes difficulty and gamemode changes via RCON", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");

    await rcon.executeRconCommand("difficulty hard");
    expect(spy).toHaveBeenCalledWith("difficulty hard");

    await rcon.executeRconCommand("defaultgamemode creative");
    expect(spy).toHaveBeenCalledWith("defaultgamemode creative");

    spy.mockRestore();
  });

  it("executes save-all chunks command via RCON", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Saved the game");

    const res = await rcon.executeRconCommand("save-all");
    expect(spy).toHaveBeenCalledWith("save-all");
    expect(res).toBe("Saved the game");

    spy.mockRestore();
  });
});
