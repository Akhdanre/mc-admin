import "server-only";
import fs from "fs/promises";
import path from "path";
import { config } from "@/server/config";
import type { DiscordConfig } from "@/types";

const CONFIG_FILE = "discord_config.json";

const DEFAULT_CONFIG: DiscordConfig = {
  webhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
  enabled: Boolean(process.env.DISCORD_WEBHOOK_URL),
  relayChat: true,
  relayEvents: true,
};

let memoryConfig: DiscordConfig | null = null;

function getConfigPath(): string {
  return path.join(config.paths.data, CONFIG_FILE);
}

export async function getDiscordConfig(): Promise<DiscordConfig> {
  if (memoryConfig) return memoryConfig;

  try {
    const raw = await fs.readFile(getConfigPath(), "utf-8");
    const parsed = JSON.parse(raw);
    memoryConfig = {
      webhookUrl: parsed.webhookUrl || process.env.DISCORD_WEBHOOK_URL || "",
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : Boolean(parsed.webhookUrl),
      relayChat: typeof parsed.relayChat === "boolean" ? parsed.relayChat : true,
      relayEvents: typeof parsed.relayEvents === "boolean" ? parsed.relayEvents : true,
    };
    return memoryConfig;
  } catch {
    memoryConfig = { ...DEFAULT_CONFIG };
    return memoryConfig;
  }
}

export async function saveDiscordConfig(updates: Partial<DiscordConfig>): Promise<DiscordConfig> {
  const current = await getDiscordConfig();
  const updated: DiscordConfig = {
    webhookUrl: updates.webhookUrl !== undefined ? updates.webhookUrl.trim() : current.webhookUrl,
    enabled: updates.enabled !== undefined ? updates.enabled : current.enabled,
    relayChat: updates.relayChat !== undefined ? updates.relayChat : current.relayChat,
    relayEvents: updates.relayEvents !== undefined ? updates.relayEvents : current.relayEvents,
  };

  memoryConfig = updated;

  try {
    const filePath = getConfigPath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2), "utf-8");
  } catch (err) {
    console.warn("Failed persisting discord_config.json to disk:", err);
  }

  return updated;
}

export async function sendDiscordPayload(
  payload: Record<string, unknown>,
  targetUrl?: string
): Promise<{ success: boolean; error?: string }> {
  const cfg = await getDiscordConfig();
  const url = targetUrl || cfg.webhookUrl;

  if (!url) {
    return { success: false, error: "Discord Webhook URL not configured" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Discord HTTP ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error posting to Discord",
    };
  }
}

export async function sendDiscordChatMessage(
  sender: string,
  message: string,
  isServer = false
): Promise<boolean> {
  const cfg = await getDiscordConfig();
  if (!cfg.enabled || !cfg.relayChat || !cfg.webhookUrl) return false;

  const isServerBroadcast = isServer || sender.toLowerCase() === "server";
  const username = isServerBroadcast ? "Minecraft Server" : sender;
  const avatarUrl = isServerBroadcast
    ? "https://raw.githubusercontent.com/itzg/docker-minecraft-server/master/docs/assets/minecraft.png"
    : `https://mc-heads.net/avatar/${encodeURIComponent(sender)}/128`;

  const payload = {
    username,
    avatar_url: avatarUrl,
    content: message,
  };

  const res = await sendDiscordPayload(payload);
  return res.success;
}

export async function sendDiscordEvent(
  title: string,
  description: string,
  color = 0x5865f2 // Discord blurple
): Promise<boolean> {
  const cfg = await getDiscordConfig();
  if (!cfg.enabled || !cfg.relayEvents || !cfg.webhookUrl) return false;

  const payload = {
    username: "Minecraft Server",
    embeds: [
      {
        title,
        description,
        color,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await sendDiscordPayload(payload);
  return res.success;
}

export async function testDiscordWebhook(
  url?: string
): Promise<{ success: boolean; error?: string }> {
  return sendDiscordPayload(
    {
      username: "Minecraft Admin Panel",
      content: "✅ Discord Webhook connected successfully! Live in-game messages will now relay to this channel.",
    },
    url
  );
}
