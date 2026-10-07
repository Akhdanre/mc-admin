import { describe, expect, it } from "bun:test";
import { getActiveLevelName } from "@/server/services/worldImport";

describe("world import service", () => {
  it("resolves default level name", async () => {
    const levelName = await getActiveLevelName();
    expect(typeof levelName).toBe("string");
    expect(levelName.length).toBeGreaterThan(0);
  });
});
