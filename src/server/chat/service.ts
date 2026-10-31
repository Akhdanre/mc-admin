import "server-only";
import fs from "fs";
import path from "path";
import readline from "readline";
import { config } from "@/server/core";
import { parseChatLine, parseConsoleLogLine } from "./parse";
import { executeRconCommand } from "@/server/rcon";
import type { ChatMessage, ChatResponse, ConsoleLogItem, ConsoleLogsResponse } from "@/types";

const MAX_CHAT_MESSAGES = 150;

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

export async function sendChatMessage(
  message: string
): Promise<{ success: boolean; error?: string }> {
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

export async function getRecentConsoleLogs(limit = 200): Promise<ConsoleLogsResponse> {
  const updatedAt = new Date().toLocaleTimeString();
  const logPath = path.join(config.paths.data, "logs", "latest.log");

  try {
    if (!fs.existsSync(logPath)) {
      return { logs: [], updatedAt };
    }

    const { promise, resolve, reject } = Promise.withResolvers<ConsoleLogItem[]>();
    const lines: string[] = [];

    const fileStream = fs.createReadStream(logPath, { encoding: "utf-8" });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on("line", (line) => {
      if (line.trim().length > 0) {
        lines.push(line);
        if (lines.length > limit * 2) {
          lines.splice(0, lines.length - limit);
        }
      }
    });

    rl.on("close", () => {
      const slice = lines.slice(-limit);
      const parsed = slice.map((l, i) => parseConsoleLogLine(l, i));
      resolve(parsed);
    });

    rl.on("error", (err) => reject(err));
    fileStream.on("error", (err) => reject(err));

    const logs = await promise;
    return { logs, updatedAt };
  } catch (err: unknown) {
    return {
      logs: [],
      error: err instanceof Error ? err.message : String(err),
      updatedAt,
    };
  }
}
