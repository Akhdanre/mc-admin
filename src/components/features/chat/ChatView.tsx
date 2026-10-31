"use client";

import { useState, useEffect, useRef, useCallback, type SubmitEvent } from "react";
import { usePolling } from "@/hooks/usePolling";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { apiGet, apiPost } from "@/lib/api";
import type { ChatMessage, ChatResponse } from "@/types";

export interface ChatViewProps {
  livePlayers?: string[];
  onExecuteCommand?: (command: string) => Promise<string>;
}
type ChatChannel = "all" | "in-game" | "discord" | "staff";

interface DisplayMessage {
  id: string;
  sender: string;
  role: "admin" | "moderator" | "vip" | "member" | "bot" | "server";
  text: string;
  timestamp: string;
  channel: "all" | "in-game" | "discord" | "staff";
}

export function ChatView({ livePlayers = [], onExecuteCommand }: ChatViewProps) {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel>("all");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [slowmode, setSlowmode] = useState(false);
  const [muteAll, setMuteAll] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChat = useCallback(async () => {
    try {
      const data = await apiGet<ChatResponse>("/api/chat");
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const incoming: DisplayMessage[] = data.messages
            .filter((m) => {
              const lower = (m.message || "").toLowerCase();
              return (
                !lower.includes("dashboard connected") && !lower.includes("pulse mc dashboard")
              );
            })
            .map((m: ChatMessage) => ({
              id: m.id || `${m.timestamp}-${m.sender}-${m.message}`,
              sender: m.sender,
              role: m.isServer
                ? "server"
                : m.sender.toLowerCase().includes("admin")
                  ? "admin"
                  : "member",
              text: m.message,
              timestamp: m.timestamp,
              channel: "in-game",
            }));
          const existingKeys = new Set(prev.map((p) => `${p.timestamp}-${p.sender}-${p.text}`));
          const newItems = incoming.filter(
            (item) => !existingKeys.has(`${item.timestamp}-${item.sender}-${item.text}`)
          );
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      }
    } catch {
      // offline fallback
    }
  }, []);

  usePolling(fetchChat, isLive ? 10000 : 3000);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/chat/stream");
      es.onopen = () => setIsLive(true);
      es.onmessage = (event) => {
        if (!event.data || event.data.startsWith(":")) return;
        try {
          const msg = JSON.parse(event.data) as ChatMessage;
          const lower = (msg.message || "").toLowerCase();
          if (lower.includes("dashboard connected") || lower.includes("pulse mc dashboard")) {
            return;
          }
          const displayMsg: DisplayMessage = {
            id: msg.id || `${msg.timestamp}-${msg.sender}-${msg.message}`,
            sender: msg.sender,
            role: msg.isServer ? "server" : "member",
            text: msg.message,
            timestamp: msg.timestamp,
            channel: "in-game",
          };
          setMessages((prev) =>
            prev.some(
              (m) =>
                `${m.timestamp}-${m.sender}-${m.text}` ===
                `${displayMsg.timestamp}-${displayMsg.sender}-${displayMsg.text}`
            )
              ? prev
              : [...prev, displayMsg]
          );
        } catch {
          // ignore
        }
      };
      es.onerror = () => setIsLive(false);
    } catch {
      // ignore
    }
    return () => es?.close();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedChannel]);

  const handleSendMessage = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = inputText.trim();
    if (!clean || isSending) return;

    setIsSending(true);
    const newMsg: DisplayMessage = {
      id: `local-${Date.now()}`,
      sender: "Admin (You)",
      role: "admin",
      text: clean,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      channel: selectedChannel === "all" ? "in-game" : selectedChannel,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    try {
      await apiPost("/api/chat", { message: clean });
    } catch (err: unknown) {
      setActionNotice(err instanceof Error ? err.message : "Failed to broadcast message");
      setTimeout(() => setActionNotice(null), 3000);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    if (onExecuteCommand) {
      try {
        await onExecuteCommand(
          'tellraw @a [{"text":"\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n\\n[Server] Chat cleared by Admin."}]'
        );
      } catch {
        // ignore
      }
    }
    setMessages([]);
    setActionNotice("In-game chat cleared.");
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleToggleSlowmode = async () => {
    const next = !slowmode;
    setSlowmode(next);
    if (onExecuteCommand) {
      try {
        await onExecuteCommand(
          `say [Server] Chat slowmode is now ${next ? "enabled (5s interval)" : "disabled"}.`
        );
      } catch {
        // ignore
      }
    }
    setActionNotice(`Slowmode ${next ? "enabled (5s interval)" : "disabled"}.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleToggleMute = async () => {
    const next = !muteAll;
    setMuteAll(next);
    if (onExecuteCommand) {
      try {
        await onExecuteCommand(
          `say [Server] Emergency chat mute is now ${next ? "ACTIVE" : "LIFTED"}.`
        );
      } catch {
        // ignore
      }
    }
    setActionNotice(`Emergency mute ${next ? "active" : "lifted"}.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const filteredMessages = messages.filter((m) => {
    if (selectedChannel === "all") return true;
    return m.channel === selectedChannel;
  });

  return (
    <div className="space-y-3.5 flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-2.5 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button
            onClick={() => setActionNotice(null)}
            className="text-subtle-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Live Chat
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> RUNNING · In-Game Chat Stream ·
            Discord SRV Bridge Active (#general)
          </p>
        </div>
      </div>

      {/* Chat Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Channel Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-lg">
          {[
            { id: "all", label: "All Messages", count: messages.length },
            {
              id: "in-game",
              label: "In-Game",
              count: messages.filter((m) => m.channel === "in-game").length,
            },
            {
              id: "discord",
              label: "Discord Bridge",
              count: messages.filter((m) => m.channel === "discord").length,
            },
            {
              id: "staff",
              label: "Staff Chat",
              count: messages.filter((m) => m.channel === "staff").length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedChannel(tab.id as ChatChannel)}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                selectedChannel === tab.id
                  ? "bg-heading text-background font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-heading hover:bg-surface-raised"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "text-overline font-mono px-1 rounded",
                  selectedChannel === tab.id
                    ? "bg-background/20 text-background"
                    : "bg-surface-raised text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Chat Utilities */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Discord Bridge Active
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-heading text-background font-mono shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            Live Stream
          </div>
        </div>
      </div>

      {/* Chat Split Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Left Column: Chat Feed Card */}
        <div className="bg-surface border border-border rounded-xl shadow-xs flex flex-col min-h-0 overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-1 font-mono text-xs divide-y divide-border/30">
            {filteredMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No chat messages in this channel yet.
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex items-center gap-2.5 py-1.5 px-1 hover:bg-surface-raised/40 rounded transition-colors group"
                >
                  {/* Timestamp */}
                  <span className="text-xs font-mono text-muted-foreground shrink-0 tabular-nums select-none min-w-[54px]">
                    {msg.timestamp.match(/\d{2}:\d{2}(?::\d{2})?/)?.[0] || msg.timestamp}
                  </span>

                  {/* Author Tag */}
                  <div className="shrink-0 flex items-center gap-1">
                    {msg.role === "bot" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <span>{msg.sender}</span>
                        <span className="text-overline bg-primary text-primary-foreground px-1 rounded font-bold">
                          BOT
                        </span>
                      </span>
                    ) : msg.role === "server" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-danger-surface text-danger border border-danger-border">
                        {msg.sender}
                      </span>
                    ) : msg.role === "admin" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        {msg.sender}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-info-surface text-info border border-info-border">
                        {msg.sender}
                      </span>
                    )}
                  </div>

                  {/* Message Content */}
                  <span className="text-xs text-heading break-words flex-1 min-w-0 font-sans">
                    {msg.text}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Send Input Row */}
          <div className="p-2.5 border-t border-border bg-surface-raised/50 shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-info-surface text-info border border-info-border shrink-0 font-mono">
                [Server Admin]
              </span>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type in-game message or announcement (Enter to send)..."
                disabled={isSending}
                className="flex-1 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />

              <Button
                type="submit"
                variant="primary"
                disabled={isSending || !inputText.trim()}
                className="h-8 px-3.5 text-xs font-medium gap-1.5 shrink-0"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
                <span>Send</span>
              </Button>
            </form>
          </div>
        </div>

        {/* Right Column: Chat Participants Panel */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Panel Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-heading">Active In Chat</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-success-surface text-success border border-success-border font-mono">
                {livePlayers.length} online
              </span>
            </div>

            {/* Participants List */}
            <div className="space-y-1.5">
              {livePlayers.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground bg-surface-raised/40 rounded-lg font-sans">
                  No players currently online in-game.
                </div>
              ) : (
                livePlayers.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-2 rounded-lg bg-surface-raised/50 border border-border/60 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                      <span className="font-semibold text-heading truncate">{name}</span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">
                      In-Game
                    </span>
                  </div>
                ))
              )}
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-raised/50 border border-border/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-info shrink-0" />
                  <span className="font-semibold text-heading truncate">Console (RCON)</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">Admin</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-surface-raised/50 border border-border/60 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  <span className="font-semibold text-heading truncate">Discord Relay</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">Bridge</span>
              </div>
            </div>
          </div>
          {/* Chat Moderation Box */}
          <div className="p-3 rounded-lg bg-surface-raised/50 border border-border space-y-2">
            <span className="text-overline text-muted-foreground uppercase block">
              Chat Moderation
            </span>

            <button
              type="button"
              onClick={handleClearChat}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded bg-surface border border-border hover:bg-surface-raised text-xs text-heading transition-colors cursor-pointer"
            >
              <span className="text-xs text-muted-foreground">🗑️</span>
              <span>Clear In-Game Chat</span>
            </button>

            <button
              type="button"
              onClick={handleToggleSlowmode}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs transition-colors cursor-pointer",
                slowmode
                  ? "bg-warning-surface border-warning-border text-warning font-semibold"
                  : "bg-surface border-border hover:bg-surface-raised text-heading"
              )}
            >
              <span className="text-xs text-muted-foreground">⏱️</span>
              <span>{slowmode ? "Slowmode Active (5s)" : "Toggle Slowmode (5s)"}</span>
            </button>

            <button
              type="button"
              onClick={handleToggleMute}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-1.5 rounded border text-xs transition-colors cursor-pointer",
                muteAll
                  ? "bg-danger-surface border-danger-border text-danger font-semibold"
                  : "bg-surface border-border hover:bg-surface-raised text-heading"
              )}
            >
              <span className="text-xs text-muted-foreground">🔇</span>
              <span>{muteAll ? "Mute Active (Emergency)" : "Mute All (Emergency)"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
