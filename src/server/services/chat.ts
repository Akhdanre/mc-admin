import "server-only";
import fs from "fs";
import path from "path";
import readline from "readline";
import { config } from "@/server/config";
import { executeRconCommand } from "@/server/services/rcon";
import type { ChatMessage, ChatResponse } from "@/types";

const MAX_CHAT_MESSAGES = 150;

// Matches Forge / Vanilla timestamps: [06Oct2026 11:48:04.547] or [11:48:04]
const TIMESTAMP_REGEX = /^\[([^\]]+)\]/;

// Matches [Not Secure] <Username> Message or <Username> Message
const PLAYER_CHAT_REGEX = /<([a-zA-Z0-9_]{1,16})>\s*(.*)$/;

// Matches [Server] Message
const SERVER_CHAT_REGEX = /\[Server\]\s*(.*)$/;

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
