import { describe, expect, it } from "bun:test";
import { getDiscordConfig, saveDiscordConfig } from "./discord";

describe("Discord Webhook Service", () => {
  it("loads default config safely", async () => {
    const cfg = await getDiscordConfig();
    expect(cfg).toBeDefined();
    expect(typeof cfg.enabled).toBe("boolean");
    expect(typeof cfg.relayChat).toBe("boolean");
    expect(typeof cfg.relayEvents).toBe("boolean");
  });

  it("updates and saves discord config in memory", async () => {
    const updated = await saveDiscordConfig({
      webhookUrl: "https://discord.com/api/webhooks/123/abc",
      enabled: true,
      relayChat: true,
      relayEvents: false,
    });

    expect(updated.webhookUrl).toBe("https://discord.com/api/webhooks/123/abc");
    expect(updated.enabled).toBe(true);
    expect(updated.relayChat).toBe(true);
    expect(updated.relayEvents).toBe(false);

    const reloaded = await getDiscordConfig();
    expect(reloaded.webhookUrl).toBe("https://discord.com/api/webhooks/123/abc");
    expect(reloaded.relayEvents).toBe(false);
  });
});
