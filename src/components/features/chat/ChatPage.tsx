"use client";

import { useState, useEffect, useRef, useCallback, type SubmitEvent } from "react";
import { usePolling } from "@/hooks/usePolling";
import { Button, SegmentedControl } from "@/components/ui";
import { MOCK_CHAT_MESSAGES } from "@/lib/mockData";
import { cn } from "@/lib/cn";
import type { ChatMessage, ChatResponse } from "@/types";

type ChatChannel = "All" | "Global" | "Staff" | "Discord";

interface DisplayMessage {
  id: string;
  sender: string;
  role: "admin" | "moderator" | "vip" | "member";
  text: string;
  timestamp: string;
  channel: string;
}

export function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel>("All");
  const [messages, setMessages] = useState<DisplayMessage[]>(() => {
    return MOCK_CHAT_MESSAGES as DisplayMessage[];
  });
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = (await res.json()) as ChatResponse;
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const incoming: DisplayMessage[] = data.messages.map((m: ChatMessage) => ({
            id: m.id || `${m.timestamp}-${m.sender}`,
            sender: m.sender,
            role: m.sender.toLowerCase().includes("admin") || m.sender.startsWith("_") ? "admin" : "member",
            text: m.message,
            timestamp: m.timestamp,
            channel: "Global",
          }));
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = incoming.filter((item) => !existingIds.has(item.id));
          return newItems.length > 0 ? [...prev, ...newItems] : prev;
        });
      }
    } catch {
      // silent polling failure
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
          const displayMsg: DisplayMessage = {
            id: msg.id || `${msg.timestamp}-${msg.sender}`,
            sender: msg.sender,
            role: "member",
            text: msg.message,
            timestamp: msg.timestamp,
            channel: "Global",
          };
          setMessages((prev) => (prev.some((m) => m.id === displayMsg.id) ? prev : [...prev, displayMsg]));
        } catch {
          // ignore
        }
      };
      es.onerror = () => setIsLive(false);
    } catch {
      // ignore
    }
    return () => {
      es?.close();
    };
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
      sender: "Console (Admin)",
      role: "admin",
      text: broadcastMode ? `[BROADCAST] ${clean}` : clean,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      channel: selectedChannel === "All" ? "Global" : selectedChannel,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: broadcastMode ? `[ALERT] ${clean}` : clean,
        }),
      });
    } catch {
      // non-fatal
    } finally {
      setIsSending(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (selectedChannel === "All") return true;
    return m.channel.toLowerCase() === selectedChannel.toLowerCase();
  });

  const roleColors = {
    admin: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    moderator: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    vip: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    member: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-6.5rem)]">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Live Chat
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-emerald-500 font-bold">●</span> ONLINE · In-Game Chat Bridge · Discord Sync Active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isLive ? "SSE Stream Connected" : "Polling Active (3s)"}
          </span>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Chat Toolbar */}
        <div className="p-3 border-b border-border bg-surface flex flex-wrap items-center justify-between gap-2">
          <SegmentedControl
            size="sm"
            value={selectedChannel}
            onChange={(val) => setSelectedChannel(val as ChatChannel)}
            options={[
              { value: "All", label: "All Chat", badge: messages.length },
              { value: "Global", label: "In-Game Global" },
              { value: "Staff", label: "Staff Only" },
              { value: "Discord", label: "Discord Bridge" },
            ]}
          />

          <button
            type="button"
            onClick={() => setBroadcastMode(!broadcastMode)}
            className={cn(
              "px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5",
              broadcastMode
                ? "bg-rose-500/10 border-rose-500/30 text-rose-500 font-semibold"
                : "bg-surface-raised border-border text-muted-foreground hover:text-heading"
            )}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {broadcastMode ? "Broadcast Mode: ON" : "Broadcast Mode"}
          </button>
        </div>

        {/* Message Stream Viewport */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-surface/50">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
              No chat messages in this channel yet.
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-surface-raised border border-border flex items-center justify-center font-mono text-xs font-semibold text-primary-muted shrink-0 select-none">
                  {msg.sender.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-heading">{msg.sender}</span>
                    <span
                      className={cn(
                        "text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border",
                        roleColors[msg.role] || roleColors.member
                      )}
                    >
                      {msg.role}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {msg.channel}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {msg.timestamp}
                    </span>
                  </div>
                  <div className="text-xs text-heading mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Form */}
        <div className="p-3 border-t border-border bg-surface">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                broadcastMode
                  ? "Type critical broadcast announcement to all connected players..."
                  : `Message #${selectedChannel} as Console...`
              }
              disabled={isSending}
              className={cn(
                "flex-1 bg-surface-raised border rounded-lg px-3.5 py-2 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1",
                broadcastMode
                  ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500"
                  : "border-border focus:border-primary focus:ring-primary"
              )}
            />
            <Button
              type="submit"
              variant={broadcastMode ? "danger" : "primary"}
              disabled={isSending || !inputText.trim()}
              className="h-9 px-4 text-xs font-medium"
            >
              {isSending ? "Sending..." : broadcastMode ? "Broadcast" : "Send"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
