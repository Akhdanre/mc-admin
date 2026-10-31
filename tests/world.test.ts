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
});

describe("Server Gamerule Mutation", () => {
  it("dispatches RCON command for valid gamerule", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue(
      "Gamerule keepInventory is now set to: true"
    );

    const result = await setServerGamerule("keepInventory", true);
    expect(spy).toHaveBeenCalledWith("gamerule keepInventory true");
    expect(result.success).toBe(true);
    expect(result.rule).toBe("keepInventory");
    expect(result.value).toBe(true);

    spy.mockRestore();
  });

  it("dispatches numeric gamerule RCON command", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue(
      "Gamerule randomTickSpeed is now set to: 5"
    );

    const result = await setServerGamerule("randomTickSpeed", 5);
    expect(spy).toHaveBeenCalledWith("gamerule randomTickSpeed 5");
    expect(result.success).toBe(true);
    expect(result.value).toBe(5);

    spy.mockRestore();
  });

  it("throws error for unknown gamerule", async () => {
    await expect(setServerGamerule("invalidGameruleName", true)).rejects.toThrow(
      "Unknown gamerule: invalidGameruleName"
    );
  });

  it("fetches world stats without throwing", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockImplementation(async (cmd) => {
      if (cmd.includes("time")) return "The time is 12000";
      if (cmd.includes("difficulty")) return "The difficulty is Normal";
      if (cmd.includes("seed")) return "Seed: [4268910435170371502]";
      return "is currently set to: true";
    });

    const stats = await getWorldStats(true);
    expect(stats).toBeDefined();
    expect(typeof stats.seed).toBe("string");
    expect(typeof stats.daytime).toBe("number");
    expect(Array.isArray(stats.dimensions)).toBe(true);
    expect(Array.isArray(stats.gamerules)).toBe(true);
    expect(stats.gamerules.length).toBe(45);

    spy.mockRestore();
  });
});
