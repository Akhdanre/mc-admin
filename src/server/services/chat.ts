import "server-only";
import fs from "fs";
import path from "path";
import readline from "readline";
import { EventEmitter } from "events";
import { config } from "@/server/config";
import { executeRconCommand } from "@/server/services/rcon";
import { sendDiscordChatMessage, sendDiscordEvent } from "@/server/services/discord";
import type { ChatMessage, ChatResponse } from "@/types";

const MAX_CHAT_MESSAGES = 150;

// Matches Forge / Vanilla timestamps: [06Oct2026 11:48:04.547] or [11:48:04]
const TIMESTAMP_REGEX = /^\[([^\]]+)\]/;

// Matches [Not Secure] <Username> Message or <Username> Message
const PLAYER_CHAT_REGEX = /<([a-zA-Z0-9_]{1,16})>\s*(.*)$/;

// Matches [Server] Message
const SERVER_CHAT_REGEX = /\[Server\]\s*(.*)$/;
export const JOIN_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+joined the game/;
export const LEAVE_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+left the game/;
export const ADVANCEMENT_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+(has made the advancement|has completed the challenge|has reached the goal)\s+(\[.+\])/;
export const DEATH_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+(was slain by|was shot by|was blown up by|was killed by|was impaled by|was doomed to fall by|fell from a high place|fell out of the world|fell off|hit the ground too hard|drowned|withered away|burned to death|went up in flames|walked into fire|walked into danger|suffocated in a wall|tried to swim in lava|starved to death|died|was squashed by|was struck by lightning|froze to death|discovered floor was lava|was stung to death|was roasted|was squished|experienced kinetic energy|blew up|was killed)(.*)$/;

export function parseServerEvent(line: string): { type: "join" | "leave" | "advancement" | "death"; title: string; description: string; color: number } | null {
  const joinMatch = line.match(JOIN_REGEX);
  if (joinMatch) {
    return {
      type: "join",
      title: "Player Joined",
      description: `**${joinMatch[1]}** joined the game`,
      color: 0x57f287,
    };
  }

  const leaveMatch = line.match(LEAVE_REGEX);
  if (leaveMatch) {
    return {
      type: "leave",
      title: "Player Left",
      description: `**${leaveMatch[1]}** left the game`,
      color: 0xed4245,
    };
  }

  const advMatch = line.match(ADVANCEMENT_REGEX);
  if (advMatch) {
    return {
      type: "advancement",
      title: "Advancement Made",
      description: `🏆 **${advMatch[1]}** ${advMatch[2]} **${advMatch[3]}**`,
      color: 0xfee75c,
    };
  }

  const deathMatch = line.match(DEATH_REGEX);
  if (deathMatch) {
    const victim = deathMatch[1];
    const deathText = `${victim} ${deathMatch[2]}${deathMatch[3] || ""}`.trim();
    return {
      type: "death",
      title: "Player Death",
      description: `💀 **${deathText}**`,
      color: 0xed4245,
    };
  }

  return null;
}
export function parseChatLine(line: string, index: number): ChatMessage | null {
  const tsMatch = line.match(TIMESTAMP_REGEX);
  const timestamp = tsMatch ? tsMatch[1] : "";

  const playerMatch = line.match(PLAYER_CHAT_REGEX);
  if (playerMatch) {
    return {
      id: `chat-${index}-${Date.now()}`,
      sender: playerMatch[1],
      message: playerMatch[2].trim(),
      timestamp,
      isServer: false,
    };
  }

  const serverMatch = line.match(SERVER_CHAT_REGEX);
  if (serverMatch) {
    return {
      id: `chat-${index}-${Date.now()}`,
      sender: "Server",
      message: serverMatch[1].trim(),
      timestamp,
      isServer: true,
    };
  }

  return null;
}

export async function getRecentChatMessages(): Promise<ChatResponse> {
  const updatedAt = new Date().toLocaleTimeString();
  const logPath = path.join(config.paths.data, "logs", "latest.log");

  try {
    if (!fs.existsSync(logPath)) {
      return { messages: [], updatedAt };
    }

    const { promise, resolve, reject } = Promise.withResolvers<ChatMessage[]>();
    const messages: ChatMessage[] = [];
    let lineIndex = 0;

    const fileStream = fs.createReadStream(logPath, { encoding: "utf-8" });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      lineIndex++;
      const chat = parseChatLine(line, lineIndex);
      if (chat) {
        messages.push(chat);
        if (messages.length > MAX_CHAT_MESSAGES * 2) {
          messages.splice(0, messages.length - MAX_CHAT_MESSAGES);
        }
      }
    });

    rl.on("close", () => {
      if (messages.length > MAX_CHAT_MESSAGES) {
        resolve(messages.slice(messages.length - MAX_CHAT_MESSAGES));
      } else {
        resolve(messages);
      }
    });

    rl.on("error", (err) => reject(err));
    fileStream.on("error", (err) => reject(err));

    const result = await promise;
    return { messages: result, updatedAt };
  } catch (err: unknown) {
    return {
      messages: [],
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}

export async function sendChatMessage(message: string): Promise<{ success: boolean; error?: string }> {
  const cleanMessage = message.trim();
  if (!cleanMessage) {
    return { success: false, error: "Message cannot be empty" };
  }

  // Sanitize newlines to prevent command injection
  const sanitized = cleanMessage.replace(/[\r\n]+/g, " ");

  try {
    await executeRconCommand(`say ${sanitized}`);
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to broadcast message",
    };
  }
}

// ---------------------------------------------------------------------------
// Realtime Log File Tailer & Event Stream
// ---------------------------------------------------------------------------

class ChatLogTailer extends EventEmitter {
  private logPath: string;
  private currentOffset = 0;
  private isWatching = false;
  private timer: NodeJS.Timeout | null = null;
  private isChecking = false;

  constructor(logPath: string) {
    super();
    this.logPath = logPath;
  }

  public async start(): Promise<void> {
    if (this.isWatching) return;
    this.isWatching = true;

    try {
      const stat = await fs.promises.stat(this.logPath);
      this.currentOffset = stat.size;
    } catch {
      this.currentOffset = 0;
    }

    console.log(`[ChatTailer] Started monitoring ${this.logPath} (offset: ${this.currentOffset})`);

    // Active stat polling every 500ms for reliable bind-mount updates across containers
    this.timer = setInterval(() => {
      this.checkNewBytes().catch(() => {});
    }, 500);
  }

  public stop(): void {
    clearInterval(this.timer!);
    this.timer = null;
    this.isWatching = false;
  }

  private async checkNewBytes(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const stat = await fs.promises.stat(this.logPath);
      if (stat.size > this.currentOffset) {
        const start = this.currentOffset;
        this.currentOffset = stat.size;
        await this.readNewLines(start, stat.size);
      } else if (stat.size < this.currentOffset) {
        // Log rotated
        this.currentOffset = stat.size;
        await this.readNewLines(0, stat.size);
      }
    } catch {
      // File might not exist yet
    } finally {
      this.isChecking = false;
    }
  }

  private async readNewLines(start: number, end: number): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();
    try {
      const stream = fs.createReadStream(this.logPath, {
        start,
        end: end - 1,
        encoding: "utf-8",
      });

      const rl = readline.createInterface({
        input: stream,
        crlfDelay: Infinity,
      });

      rl.on("line", (line) => {
        const chat = parseChatLine(line, 0);
        if (chat) {
          console.log(`[ChatTailer] Detected in-game chat: <${chat.sender}> ${chat.message}`);
          this.emit("chat", chat);
          sendDiscordChatMessage(chat.sender, chat.message, chat.isServer).catch((err) => {
            console.error(`[ChatTailer] Failed sending to Discord webhook:`, err);
          });
        } else {
          const event = parseServerEvent(line);
          if (event) {
            console.log(`[ChatTailer] Detected server event (${event.type}): ${event.description}`);
            sendDiscordEvent(event.title, event.description, event.color).catch((err) => {
              console.error(`[ChatTailer] Failed sending event to Discord:`, err);
            });
          }
        }
      });
      rl.on("error", () => resolve());
    } catch {
      resolve();
    }
    return promise;
  }
}

declare global {
  var __mcChatTailer: ChatLogTailer | undefined;
}

const tailer =
  globalThis.__mcChatTailer ??
  new ChatLogTailer(path.join(config.paths.data, "logs", "latest.log"));
globalThis.__mcChatTailer = tailer;

export function startChatTailer(): void {
  tailer.start();
}
export function subscribeToChatStream(callback: (msg: ChatMessage) => void): () => void {
  tailer.start();
  tailer.on("chat", callback);
  return () => {
    tailer.off("chat", callback);
  };
}
