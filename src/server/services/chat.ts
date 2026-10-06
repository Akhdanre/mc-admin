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
const JOIN_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+joined the game/;
const LEAVE_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+left the game/;

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
  private lineCount = 0;

  constructor(logPath: string) {
    super();
    this.logPath = logPath;
  }

  public start() {
    if (this.isWatching) return;
    this.isWatching = true;

    try {
      if (fs.existsSync(this.logPath)) {
        const stat = fs.statSync(this.logPath);
        this.currentOffset = stat.size;
      }
    } catch {
      this.currentOffset = 0;
    }

    // Watch for log additions with 300ms polling for reliable Docker volume events
    fs.watchFile(this.logPath, { interval: 300 }, (curr) => {
      if (curr.size > this.currentOffset) {
        this.readNewLines(this.currentOffset, curr.size);
        this.currentOffset = curr.size;
      } else if (curr.size < this.currentOffset) {
        // Log rotation
        this.currentOffset = 0;
        this.readNewLines(0, curr.size);
        this.currentOffset = curr.size;
      }
    });
  }

  private readNewLines(start: number, end: number) {
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
        this.lineCount++;
        const chat = parseChatLine(line, this.lineCount);
        if (chat) {
          this.emit("chat", chat);
          sendDiscordChatMessage(chat.sender, chat.message, chat.isServer).catch(() => {});
        } else {
          const joinMatch = line.match(JOIN_REGEX);
          if (joinMatch) {
            sendDiscordEvent("Player Joined", `**${joinMatch[1]}** joined the game`, 0x57f287).catch(() => {});
          } else {
            const leaveMatch = line.match(LEAVE_REGEX);
            if (leaveMatch) {
              sendDiscordEvent("Player Left", `**${leaveMatch[1]}** left the game`, 0xed4245).catch(() => {});
            }
          }
        }
      });
    } catch (err) {
      console.warn("Failed reading new lines from log stream:", err);
    }
  }
}

const tailer = new ChatLogTailer(path.join(config.paths.data, "logs", "latest.log"));

export function startChatTailer(): void {
  tailer.start();
}

// Auto-start tailer so background Discord relay runs 24/7
startChatTailer();

export function subscribeToChatStream(callback: (msg: ChatMessage) => void): () => void {
  tailer.start();
  tailer.on("chat", callback);
  return () => {
    tailer.off("chat", callback);
  };
}
