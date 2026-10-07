import "server-only";
import { getDiscordConfig } from "@/server/services/discord";
import { executeRconCommand } from "@/server/services/rcon";

// Discord Gateway OpCodes
const OP_DISPATCH = 0;
const OP_HEARTBEAT = 1;
const OP_IDENTIFY = 2;
const OP_HELLO = 10;
const OP_HEARTBEAT_ACK = 11;

// Intents: GUILDS (1) | GUILD_MESSAGES (512) | MESSAGE_CONTENT (32768)
const GATEWAY_INTENTS = 1 | 512 | 32768;

interface DiscordGatewayPayload {
  op: number;
  d: unknown;
  s?: number;
  t?: string;
}

interface DiscordMessagePayload {
  channel_id: string;
  content?: string;
  webhook_id?: string;
  author?: {
    id: string;
    username?: string;
    global_name?: string;
    bot?: boolean;
  };
  member?: {
    nick?: string;
  };
}

class DiscordBotClient {
  private ws: WebSocket | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private lastSequence: number | null = null;

  public async start(): Promise<void> {
    const cfg = await getDiscordConfig();
    if (!cfg.botToken || !cfg.botChannelId || !cfg.relayDiscordToMinecraft) {
      this.stop();
      return;
    }

    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.ws = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");

      this.ws.onopen = () => {
        this.isConnecting = false;
      };

      this.ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(String(event.data)) as DiscordGatewayPayload;
          await this.handleGatewayMessage(data, cfg.botToken!, cfg.botChannelId!);
        } catch (err) {
          console.warn("Failed handling Discord gateway message:", err);
        }
      };

      this.ws.onclose = () => {
        this.cleanup();
        // Reconnect after 5 seconds if still enabled
        setTimeout(() => this.start(), 5000);
      };

      this.ws.onerror = () => {
        this.cleanup();
      };
    } catch {
      this.cleanup();
    }
  }

  public stop(): void {
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        // ignore
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    clearInterval(this.heartbeatTimer!);
    this.heartbeatTimer = null;
    this.ws = null;
    this.isConnecting = false;
    this.lastSequence = null;
  }

  private async handleGatewayMessage(
    payload: DiscordGatewayPayload,
    token: string,
    channelId: string
  ): Promise<void> {
    if (payload.s) {
      this.lastSequence = payload.s;
    }

    switch (payload.op) {
      case OP_HELLO: {
        const helloData = payload.d as { heartbeat_interval?: number } | undefined;
        const interval = helloData?.heartbeat_interval || 41250;
        this.startHeartbeat(interval);
        this.sendIdentify(token);
        break;
      }

      case OP_HEARTBEAT_ACK:
        break;

      case OP_HEARTBEAT:
        this.sendHeartbeat();
        break;

      case OP_DISPATCH:
        if (payload.t === "MESSAGE_CREATE" && payload.d) {
          await this.handleMessageCreate(payload.d as DiscordMessagePayload, channelId);
        }
        break;
    }
  }

  private startHeartbeat(intervalMs: number): void {
    clearInterval(this.heartbeatTimer!);
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);
  }

  private sendHeartbeat(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ op: OP_HEARTBEAT, d: this.lastSequence }));
    }
  }

  private sendIdentify(token: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const identifyPayload = {
        op: OP_IDENTIFY,
        d: {
          token,
          intents: GATEWAY_INTENTS,
          properties: {
            os: "linux",
            browser: "mc-admin",
            device: "mc-admin",
          },
        },
      };
      this.ws.send(JSON.stringify(identifyPayload));
    }
  }

  private async handleMessageCreate(msg: DiscordMessagePayload, targetChannelId: string): Promise<void> {
    // Ignore messages from other channels
    if (msg.channel_id !== targetChannelId) return;

    // Ignore bots and webhooks to avoid feedback loops
    if (msg.author?.bot || msg.webhook_id) return;

    const content = (msg.content || "").trim();
    if (!content) return;

    const author = msg.member?.nick || msg.author?.global_name || msg.author?.username || "Discord";

    // Escape double quotes and backslashes for tellraw JSON
    const safeAuthor = author.replace(/["\\]/g, "");
    const safeContent = content.replace(/["\\]/g, "");

    const tellrawPayload = JSON.stringify([
      { text: "[Discord] ", color: "blue", bold: true },
      { text: `<${safeAuthor}> `, color: "aqua" },
      { text: safeContent, color: "white" },
    ]);

    try {
      await executeRconCommand(`tellraw @a ${tellrawPayload}`);
    } catch (err) {
      console.warn("Failed broadcasting Discord message to Minecraft:", err);
    }
  }
}

declare global {
  var __mcDiscordBotClient: DiscordBotClient | undefined;
}

const botClient = globalThis.__mcDiscordBotClient ?? new DiscordBotClient();
globalThis.__mcDiscordBotClient = botClient;

export function startDiscordBot(): void {
  botClient.start().catch(() => {});
}

export function stopDiscordBot(): void {
  botClient.stop();
}

export function restartDiscordBot(): void {
  botClient.stop();
  botClient.start().catch(() => {});
}
