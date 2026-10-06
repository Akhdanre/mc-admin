import { describe, expect, it } from "bun:test";
import { parseChatLine } from "./chat";

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

  it("returns null for non-chat lines", () => {
    const loginLine =
      "[06Oct2026 11:59:00.677] [Server thread/INFO]: Karepto joined the game";
    expect(parseChatLine(loginLine, 4)).toBeNull();

    const garbageLine = "Some random line without tags";
    expect(parseChatLine(garbageLine, 5)).toBeNull();
  });
});
