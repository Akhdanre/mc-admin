import { describe, expect, it } from "bun:test";
import { parseChatLine, parseServerEvent } from "@/server/services/chat";

describe("Chat Log Parser", () => {
  it("parses Forge/Modded player chat lines with [Not Secure] prefix", () => {
    const line =
      "[06Oct2026 11:48:04.547] [Server thread/INFO] [net.minecraft.server.MinecraftServer/]: [Not Secure] <Karepto> lololo";
    const result = parseChatLine(line, 1);

    expect(result).not.toBeNull();
    expect(result?.sender).toBe("Karepto");
    expect(result?.message).toBe("lololo");
    expect(result?.timestamp).toBe("06Oct2026 11:48:04.547");
    expect(result?.isServer).toBe(false);
  });

  it("parses standard Vanilla Minecraft chat lines", () => {
    const line = "[12:34:56] [Server thread/INFO]: <Alex> Hello everyone!";
    const result = parseChatLine(line, 2);

    expect(result).not.toBeNull();
    expect(result?.sender).toBe("Alex");
    expect(result?.message).toBe("Hello everyone!");
    expect(result?.timestamp).toBe("12:34:56");
    expect(result?.isServer).toBe(false);
  });

  it("parses server broadcast lines", () => {
    const line = "[12:34:56] [Server thread/INFO]: [Server] Maintenance starting soon";
    const result = parseChatLine(line, 3);

    expect(result).not.toBeNull();
    expect(result?.sender).toBe("Server");
    expect(result?.message).toBe("Maintenance starting soon");
    expect(result?.isServer).toBe(true);
  });

  it("parses rcon/console broadcast lines with [Not Secure] prefix", () => {
    const line =
      "[10Oct2026 18:43:48.355] [Server thread/INFO] [net.minecraft.server.MinecraftServer/]: [Not Secure] [Rcon] test_discord_webhook";
    const result = parseChatLine(line, 4);

    expect(result).not.toBeNull();
    expect(result?.sender).toBe("Server");
    expect(result?.message).toBe("test_discord_webhook");
    expect(result?.isServer).toBe(true);
  });

  it("returns null for non-chat lines", () => {
    const loginLine =
      "[06Oct2026 11:59:00.677] [Server thread/INFO]: Karepto joined the game";
    expect(parseChatLine(loginLine, 4)).toBeNull();

    const garbageLine = "Some random line without tags";
    expect(parseChatLine(garbageLine, 5)).toBeNull();
  });

  it("parses player death events", () => {
    const pvpLine =
      "[10Oct2026 18:03:04.506] [Server thread/INFO] [net.minecraft.server.MinecraftServer/]: oukenz was slain by zackers69";
    const event = parseServerEvent(pvpLine);
    expect(event).not.toBeNull();
    expect(event?.type).toBe("death");
    expect(event?.title).toBe("Player Death");
    expect(event?.description).toContain("oukenz was slain by zackers69");

    const fallLine =
      "[10Oct2026 15:19:54.073] [Server thread/INFO] [net.minecraft.server.MinecraftServer/]: viniciusell fell from a high place";
    const fallEvent = parseServerEvent(fallLine);
    expect(fallEvent?.type).toBe("death");
    expect(fallEvent?.description).toContain("viniciusell fell from a high place");
  });

  it("parses player advancement events", () => {
    const advLine =
      "[10Oct2026 18:16:57.321] [Server thread/INFO] [net.minecraft.server.MinecraftServer/]: oukenz has made the advancement [Suit Up]";
    const event = parseServerEvent(advLine);
    expect(event).not.toBeNull();
    expect(event?.type).toBe("advancement");
    expect(event?.title).toBe("Advancement Made");
    expect(event?.description).toContain("Suit Up");
  });

  it("parses challenge and goal advancements", () => {
    const challengeLine =
      "[10Oct2026 19:00:00.000] [Server thread/INFO]: Steve has completed the challenge [How Did We Get Here?]";
    const challengeEvent = parseServerEvent(challengeLine);
    expect(challengeEvent).not.toBeNull();
    expect(challengeEvent?.type).toBe("advancement");
    expect(challengeEvent?.description).toContain("How Did We Get Here?");

    const goalLine =
      "[10Oct2026 19:05:00.000] [Server thread/INFO]: Alex has reached the goal [A Furious Cocktail]";
    const goalEvent = parseServerEvent(goalLine);
    expect(goalEvent).not.toBeNull();
    expect(goalEvent?.type).toBe("advancement");
    expect(goalEvent?.description).toContain("A Furious Cocktail");
  });

  it("parses player join and leave events", () => {
    const joinLine = "[10Oct2026 12:00:00.000] [Server thread/INFO]: Steve joined the game";
    const joinEvent = parseServerEvent(joinLine);
    expect(joinEvent).not.toBeNull();
    expect(joinEvent?.type).toBe("join");
    expect(joinEvent?.description).toContain("**Steve** joined the game");

    const leaveLine = "[10Oct2026 12:30:00.000] [Server thread/INFO]: Steve left the game";
    const leaveEvent = parseServerEvent(leaveLine);
    expect(leaveEvent).not.toBeNull();
    expect(leaveEvent?.type).toBe("leave");
    expect(leaveEvent?.description).toContain("**Steve** left the game");
  });

  it("handles complex chat messages containing colons and brackets", () => {
    const complexLine = "[14:20:00] [Server thread/INFO]: <Miner_99> coords: x=100, y=64, z=-200 [portal]";
    const msg = parseChatLine(complexLine, 10);
    expect(msg).not.toBeNull();
    expect(msg?.sender).toBe("Miner_99");
    expect(msg?.message).toBe("coords: x=100, y=64, z=-200 [portal]");
  });
});
