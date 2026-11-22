import { describe, expect, it, spyOn } from "bun:test";
import { accessControlActionSchema } from "@/schemas";
import { getAccessControlData, executeAccessAction } from "@/server/access";
import * as rcon from "@/server/rcon";

describe("Access Control Schema", () => {
  it("validates whitelist add action", () => {
    const valid = accessControlActionSchema.safeParse({
      action: "add",
      username: "Steve",
    });
    expect(valid.success).toBe(true);
  });

  it("validates ban action with reason", () => {
    const valid = accessControlActionSchema.safeParse({
      action: "ban",
      username: "Alex",
      reason: "Griefing spawn area",
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.action).toBe("ban");
      expect(valid.data.username).toBe("Alex");
      expect(valid.data.reason).toBe("Griefing spawn area");
    }
  });

  it("validates ban-ip action", () => {
    const valid = accessControlActionSchema.safeParse({
      action: "ban-ip",
      ip: "192.168.1.50",
      reason: "DDoS attempt",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects invalid usernames with illegal characters", () => {
    const invalid = accessControlActionSchema.safeParse({
      action: "add",
      username: "invalid player!",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects usernames longer than 16 characters", () => {
    const invalid = accessControlActionSchema.safeParse({
      action: "add",
      username: "superlongusernameexceeding16chars",
    });
    expect(invalid.success).toBe(false);
  });

  it("rejects unknown actions", () => {
    const invalid = accessControlActionSchema.safeParse({
      action: "destroy-server",
    });
    expect(invalid.success).toBe(false);
  });
});

describe("Access Control Service", () => {
  it("fetches access control data without throwing", async () => {
    const data = await getAccessControlData();
    expect(data).toBeDefined();
    expect(Array.isArray(data.whitelist)).toBe(true);
    expect(Array.isArray(data.bans)).toBe(true);
    expect(Array.isArray(data.ipBans)).toBe(true);
    expect(typeof data.whitelistEnforced).toBe("boolean");
    expect(typeof data.updatedAt).toBe("string");
  });

  it("throws BadRequestError on missing username for add", async () => {
    await expect(executeAccessAction({ action: "add" })).rejects.toThrow(
      "Username required for whitelist add"
    );
  });

  it("throws BadRequestError on missing username for ban", async () => {
    await expect(executeAccessAction({ action: "ban" })).rejects.toThrow(
      "Username required for ban"
    );
  });

  it("throws BadRequestError on missing ip for ban-ip", async () => {
    await expect(executeAccessAction({ action: "ban-ip" })).rejects.toThrow(
      "IP address required for ban-ip"
    );
  });

  it("dispatches whitelist add command via RCON", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Added Steve to whitelist");
    const res = await executeAccessAction({ action: "add", username: "Steve" });

    expect(spy).toHaveBeenCalledWith("whitelist add Steve");
    expect(res.result).toBe("Added Steve to whitelist");
    spy.mockRestore();
  });

  it("dispatches whitelist remove command via RCON", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Removed Steve from whitelist");
    const res = await executeAccessAction({ action: "remove", username: "Steve" });

    expect(spy).toHaveBeenCalledWith("whitelist remove Steve");
    expect(res.result).toBe("Removed Steve from whitelist");
    spy.mockRestore();
  });

  it("dispatches whitelist on/off/reload commands", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");

    await executeAccessAction({ action: "on" });
    expect(spy).toHaveBeenCalledWith("whitelist on");

    await executeAccessAction({ action: "off" });
    expect(spy).toHaveBeenCalledWith("whitelist off");

    await executeAccessAction({ action: "reload" });
    expect(spy).toHaveBeenCalledWith("whitelist reload");

    spy.mockRestore();
  });

  it("dispatches player ban and unban commands", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");

    await executeAccessAction({ action: "ban", username: "BadPlayer", reason: "Griefing" });
    expect(spy).toHaveBeenCalledWith("ban BadPlayer Griefing");

    await executeAccessAction({ action: "unban", username: "BadPlayer" });
    expect(spy).toHaveBeenCalledWith("pardon BadPlayer");

    spy.mockRestore();
  });

  it("dispatches IP ban and unban commands", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");

    await executeAccessAction({ action: "ban-ip", ip: "192.168.1.100", reason: "VPN bot" });
    expect(spy).toHaveBeenCalledWith("ban-ip 192.168.1.100 VPN bot");

    await executeAccessAction({ action: "unban-ip", ip: "192.168.1.100" });
    expect(spy).toHaveBeenCalledWith("pardon-ip 192.168.1.100");

    spy.mockRestore();
  });

  it("dispatches op and deop commands", async () => {
    const spy = spyOn(rcon, "executeRconCommand").mockResolvedValue("Success");

    await executeAccessAction({ action: "op", username: "AdminUser" });
    expect(spy).toHaveBeenCalledWith("op AdminUser");

    await executeAccessAction({ action: "deop", username: "AdminUser" });
    expect(spy).toHaveBeenCalledWith("deop AdminUser");

    spy.mockRestore();
  });
});
