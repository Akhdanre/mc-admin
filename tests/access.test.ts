import { describe, expect, it } from "bun:test";
import { accessControlActionSchema } from "@/schemas";
import { getAccessControlData, executeAccessAction } from "@/server/access";

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
});
