import "server-only";
import fs from "fs";
import path from "path";
import readline from "readline";
import { EventEmitter } from "events";
import { config } from "@/server/core";
import {
  parseChatLine,
  parseConsoleLogLine,
  parseServerEvent,
  type ParsedServerEvent,
} from "./parse";
import type { ChatMessage, ConsoleLogItem } from "@/types";

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
    clearInterval(this.timer ?? undefined);
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
        this.emit("logLine", line);
        const chat = parseChatLine(line, 0);
        if (chat) {
          console.log(`[ChatTailer] Detected in-game chat: <${chat.sender}> ${chat.message}`);
          this.emit("chat", chat);
        } else {
          const event = parseServerEvent(line);
          if (event) {
            console.log(`[ChatTailer] Detected server event (${event.type}): ${event.description}`);
            this.emit("serverEvent", event);
          }
        }
      });
      rl.on("close", () => resolve());
      rl.on("error", () => resolve());
      stream.on("error", () => resolve());
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

export function subscribeToServerEvents(callback: (event: ParsedServerEvent) => void): () => void {
  tailer.start();
  tailer.on("serverEvent", callback);
  return () => {
    tailer.off("serverEvent", callback);
  };
}

export function subscribeToLogStream(callback: (log: ConsoleLogItem) => void): () => void {
  tailer.start();
  let counter = 0;
  const handler = (line: string) => {
    counter = (counter + 1) % 10000;
    callback(parseConsoleLogLine(line, counter));
  };
  tailer.on("logLine", handler);
  return () => {
    tailer.off("logLine", handler);
  };
}
