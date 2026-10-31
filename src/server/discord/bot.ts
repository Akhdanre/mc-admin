import "server-only";
import { getDiscordConfig } from "./webhook";
import { executeRconCommand } from "@/server/rcon";

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
    const config = await getDiscordConfig();
    if (!config.enabled || !config.botToken || !config.botChannelId || !config.relayDiscordToMinecraft) {
      this.stop();
      return;
    }

    if (this.ws || this.isConnecting) return;
    this.isConnecting = true;

    try {
      const socket = new WebSocket("wss://gateway.discord.gg/?v=10&encoding=json");
      this.ws = socket;

      socket.onopen = () => {
        this.isConnecting = false;
      };

      socket.onmessage = async (event) => {
        try {
          const raw = typeof event.data === "string" ? event.data : event.data.toString();
          const payload = JSON.parse(raw) as DiscordGatewayPayload;

          if (payload.s !== undefined) {
            this.lastSequence = payload.s;
          }

          switch (payload.op) {
            case OP_HELLO: {
              const helloData = payload.d as { heartbeat_interval: number };
              this.startHeartbeat(helloData.heartbeat_interval);
              this.identify(config.botToken!);
              break;
            }

            case OP_HEARTBEAT: {
              this.sendHeartbeat();
              break;
            }

            case OP_HEARTBEAT_ACK: {
              break;
            }

            case OP_DISPATCH: {
              if (payload.t === "MESSAGE_CREATE") {
                const msg = payload.d as DiscordMessagePayload;
                await this.handleMessageCreate(msg, config.botChannelId!);
              }
              break;
            }
          }
        } catch {
          // ignore malformed payloads
        }
      };

      socket.onerror = (err) => {
        console.warn("[DiscordBot] Socket error:", err);
      };

      socket.onclose = () => {
        this.cleanup();
        // Auto-reconnect after delay if still enabled
        setTimeout(() => {
          this.start().catch(() => {});
        }, 5000);
      };
    } catch (err) {
      this.isConnecting = false;
      console.warn("[DiscordBot] Failed to initiate connection:", err);
    }
  }

  public stop(): void {
    this.cleanup();
  }

  private cleanup(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }
    this.isConnecting = false;
    this.lastSequence = null;
  }

  private startHeartbeat(intervalMs: number): void {
    clearInterval(this.heartbeatTimer ?? undefined);
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, intervalMs);
  }

  private sendHeartbeat(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ op: OP_HEARTBEAT, d: this.lastSequence }));
  }

  private identify(token: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    const identifyPayload = {
      op: OP_IDENTIFY,
      d: {
        token,
        intents: GATEWAY_INTENTS,
        properties: {
          os: "linux",
          browser: "mc-admin-dashboard",
          device: "mc-admin-dashboard",
        },
      },
    };
    this.ws.send(JSON.stringify(identifyPayload));
  }

  private async handleMessageCreate(msg: DiscordMessagePayload, targetChannelId: string): Promise<void> {
    if (msg.channel_id !== targetChannelId) return;
    if (msg.webhook_id) return; // Ignore webhook echoes
    if (msg.author?.bot) return; // Ignore bot messages

    const content = (msg.content || "").trim();
    if (!content) return;

    const author = msg.member?.nick || msg.author?.global_name || msg.author?.username || "Discord User";

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
