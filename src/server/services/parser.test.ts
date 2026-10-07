import { describe, expect, it } from "bun:test";
import { parseDifficulty, parsePlayerList, parseWhitelist } from "@/server/services/parser";

describe("parser service", () => {
  it("parses standard Minecraft player list output", () => {
    const raw = "There are 2 of a max of 20 players online: Steve, Alex";
    const result = parsePlayerList(raw);

    expect(result.onlineCount).toBe(2);
    expect(result.maxCount).toBe(20);
    expect(result.players).toEqual(["Steve", "Alex"]);
    expect(result.raw).toBe(raw);
  });

  it("handles empty player list correctly", () => {
    const raw = "There are 0 of a max of 20 players online:";
    const result = parsePlayerList(raw);

    expect(result.onlineCount).toBe(0);
    expect(result.maxCount).toBe(20);
    expect(result.players).toEqual([]);
  });

  it("handles unparseable or error output safely", () => {
    const raw = "Server error or timeout";
    const result = parsePlayerList(raw);

    expect(result.onlineCount).toBe(0);
    expect(result.maxCount).toBe(20);
    expect(result.players).toEqual([]);
  });

  it("parses whitelist output", () => {
    const raw = "There are 3 whitelisted players: Steve, Alex, Notch";
    const result = parseWhitelist(raw);

    expect(result).toEqual(["Steve", "Alex", "Notch"]);
  });

  it("returns empty array for empty whitelist", () => {
    const raw = "There are no whitelisted players";
    const result = parseWhitelist(raw);
    expect(result).toEqual([]);
  });

  it("parses Minecraft difficulty command output", () => {
    expect(parseDifficulty("The difficulty is Normal")).toBe("normal");
    expect(parseDifficulty("The difficulty is Hard")).toBe("hard");
    expect(parseDifficulty("The difficulty is Peaceful")).toBe("peaceful");
    expect(parseDifficulty("The difficulty is Easy")).toBe("easy");
    expect(parseDifficulty("Unknown command")).toBeNull();
  });
});
