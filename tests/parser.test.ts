import { describe, expect, it } from "bun:test";
import { parseDifficulty, parsePlayerList, parseWhitelist } from "@/server/rcon";
import {
  parsePosition,
  parseDimension,
  buildPlayerLocation,
  isValidUsername,
} from "@/server/domain/parse/location";

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

  it("validates Minecraft usernames", () => {
    expect(isValidUsername("Steve")).toBe(true);
    expect(isValidUsername("notch_fan_99")).toBe(true);
    expect(isValidUsername("1234567890123456")).toBe(true);
    expect(isValidUsername("toolongusernamehere123")).toBe(false);
    expect(isValidUsername("invalid user")).toBe(false);
    expect(isValidUsername("user!name")).toBe(false);
  });

  it("parses Minecraft RCON entity position output", () => {
    const raw = "[100.523d, 64.0d, -250.789d]";
    const pos = parsePosition(raw);
    expect(pos).toEqual({ x: 100.5, y: 64, z: -250.8 });
    expect(parsePosition("invalid data")).toBeNull();
  });

  it("parses Minecraft RCON entity dimension output", () => {
    expect(parseDimension('has the following entity data: "minecraft:the_nether"')).toBe("the_nether");
    expect(parseDimension('has the following entity data: "minecraft:the_end"')).toBe("the_end");
    expect(parseDimension('has the following entity data: "minecraft:overworld"')).toBe("overworld");
    expect(parseDimension('"overworld"')).toBe("overworld");
    expect(parseDimension("invalid dimension response")).toBe("overworld");
  });

  it("builds player location object from raw RCON data", () => {
    const valid = buildPlayerLocation(
      "AlexTheBuilder",
      "[120.4d, 70.0d, -50.2d]",
      'has the following entity data: "minecraft:overworld"'
    );
    expect(valid).toEqual({
      username: "AlexTheBuilder",
      x: 120.4,
      y: 70,
      z: -50.2,
      dimension: "overworld",
    });

    expect(buildPlayerLocation("bad username!", "[0d, 0d, 0d]", '"overworld"')).toBeNull();
    expect(buildPlayerLocation("ValidUser", "invalid position", '"overworld"')).toBeNull();
  });
});
