"use client";

import { useState, useEffect, useRef, useCallback, type SubmitEvent } from "react";
import { usePolling } from "@/hooks/usePolling";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { ChatMessage, ChatResponse } from "@/types";

type ChatChannel = "all" | "in-game" | "discord" | "staff";

interface DisplayMessage {
  id: string;
  sender: string;
  role: "admin" | "moderator" | "vip" | "member" | "bot" | "server";
  text: string;
  timestamp: string;
  channel: "all" | "in-game" | "discord" | "staff";
}

interface Participant {
  name: string;
  role: string;
  dotColor: string;
}

const PARTICIPANTS: Participant[] = [
  { name: "Alex_M", role: "18ms", dotColor: "bg-blue-500" },
  { name: "Steve_Builder", role: "24ms", dotColor: "bg-emerald-500" },
  { name: "Herobrine_Watcher", role: "42ms", dotColor: "bg-amber-500" },
  { name: "Discord Bot", role: "Bridge", dotColor: "bg-indigo-500" },
];

const PENPOT_CHAT_MESSAGES: DisplayMessage[] = [
  { id: "m1", timestamp: "14:02", sender: "Alex_M", role: "member", channel: "in-game", text: "Hey guys, welcome back to the server!" },
  { id: "m2", timestamp: "14:03", sender: "Steve_Builder", role: "member", channel: "in-game", text: "Anyone want to help gather quartz for spawn base?" },
  { id: "m3", timestamp: "14:03", sender: "DiscordBot#2104", role: "bot", channel: "discord", text: "[#general] @CreeperHunter: I will hop online in 10 minutes!" },
  { id: "m4", timestamp: "14:04", sender: "Server [Broadcast]", role: "server", channel: "all", text: "Automated daily backup completed successfully." },
  { id: "m5", timestamp: "14:05", sender: "Herobrine_Watcher", role: "member", channel: "in-game", text: "Watch out near coordinates 420, -120, huge creeper crater." },
  { id: "m6", timestamp: "14:06", sender: "Admin (You)", role: "admin", channel: "staff", text: "I fixed the WorldGuard flags at spawn, mining is now restricted properly." },
  { id: "m7", timestamp: "14:07", sender: "Alex_M", role: "member", channel: "in-game", text: "Awesome, thanks admin!" },
  { id: "m8", timestamp: "14:08", sender: "notch_fan_99", role: "member", channel: "in-game", text: "anyone have spare emeralds for mending book trade?" },
  { id: "m9", timestamp: "14:08", sender: "DiamondPick42", role: "member", channel: "in-game", text: "check community vault chest 3, left some earlier" },
  { id: "m10", timestamp: "14:09", sender: "DiscordBot#2104", role: "bot", channel: "discord", text: "[#announcements] Weekly build competition voting closes at 18:00 WIB!" },
  { id: "m11", timestamp: "14:10", sender: "EndermanSlayer", role: "member", channel: "in-game", text: "ender dragon respawn ritual ready in 15 mins if anyone wants XP" },
  { id: "m12", timestamp: "14:11", sender: "RedstoneMaster", role: "member", channel: "in-game", text: "fixed hopper clock lag at iron farm, tick rate should be 20 now" },
  { id: "m13", timestamp: "14:12", sender: "Admin (You)", role: "admin", channel: "staff", text: "Confirmed, spark profiler shows MSPT dropped to 14.2ms. Good work!" },
  { id: "m14", timestamp: "14:13", sender: "Steve_Builder", role: "member", channel: "in-game", text: "portal link verified, exits directly into the nether highway" },
  { id: "m15", timestamp: "14:14", sender: "Alex_M", role: "member", channel: "in-game", text: "heading over now with fire resistance potions" },
  { id: "m16", timestamp: "14:15", sender: "Server [Broadcast]", role: "server", channel: "all", text: "Server memory cleanup completed. 412 unused chunk references purged." },
  { id: "m17", timestamp: "14:16", sender: "DiamondPick42", role: "member", channel: "in-game", text: "leaving 64 blaze rods in the shared vault for brewing" },
  { id: "m18", timestamp: "14:17", sender: "notch_fan_99", role: "member", channel: "in-game", text: "thanks Diamond! grabbing 16 for ender eyes" },
  { id: "m19", timestamp: "14:18", sender: "Alex_M", role: "member", channel: "in-game", text: "reached the fortress, 3 wither skeletons spotted" },
  { id: "m20", timestamp: "14:19", sender: "Steve_Builder", role: "member", channel: "in-game", text: "placing extra torches along the walkway to stop spawns" },
  { id: "m21", timestamp: "14:20", sender: "Herobrine_Watcher", role: "member", channel: "in-game", text: "filling up the creeper crater at 420, -120 with dirt now" },
  { id: "m22", timestamp: "14:21", sender: "DiscordBot#2104", role: "bot", channel: "discord", text: "[#survival] @RedstoneMaster linked: [Dynmap Live Marker: Iron Farm Hub]" },
  { id: "m23", timestamp: "14:22", sender: "EndermanSlayer", role: "member", channel: "in-game", text: "crystals placed on bedrock pillar, waiting for 2 more players" },
  { id: "m24", timestamp: "14:23", sender: "notch_fan_99", role: "member", channel: "in-game", text: "on my way to the portal with slow falling potions" },
  { id: "m25", timestamp: "14:24", sender: "Admin (You)", role: "admin", channel: "staff", text: "Warning: Automated chunk backup scheduled in 10 minutes. Zero lag expected." },
];

export function ChatPage() {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel>("all");
  const [messages, setMessages] = useState<DisplayMessage[]>(PENPOT_CHAT_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [slowmode, setSlowmode] = useState(false);
  const [muteAll, setMuteAll] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
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
            role: m.sender.toLowerCase().includes("admin") ? "admin" : "member",
            text: m.message,
            timestamp: m.timestamp,
            channel: "in-game",
          }));
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = incoming.filter((item) => !existingIds.has(item.id));
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
          const displayMsg: DisplayMessage = {
            id: msg.id || `${msg.timestamp}-${msg.sender}`,
            sender: msg.sender,
            role: "member",
            text: msg.message,
            timestamp: msg.timestamp,
            channel: "in-game",
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
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }),
      channel: selectedChannel === "all" ? "in-game" : selectedChannel,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
      });
    } catch {
      // non-fatal
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setActionNotice("Chat feed cleared locally.");
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleToggleSlowmode = () => {
    const next = !slowmode;
    setSlowmode(next);
    setActionNotice(`Slowmode ${next ? "enabled (5s interval)" : "disabled"}.`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  const handleToggleMute = () => {
    const next = !muteAll;
    setMuteAll(next);
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
          <button onClick={() => setActionNotice(null)} className="text-subtle-foreground hover:text-foreground cursor-pointer">
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
            <span className="text-emerald-500 font-bold">●</span> RUNNING · In-Game Chat Stream · Discord SRV Bridge Active (#general)
          </p>
        </div>
      </div>

      {/* Chat Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Channel Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface border border-border rounded-lg">
          {[
            { id: "all", label: "All Messages", count: 342 },
            { id: "in-game", label: "In-Game", count: 286 },
            { id: "discord", label: "Discord Bridge", count: 56 },
            { id: "staff", label: "Staff Chat", count: 14 },
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
                  "text-[10px] font-mono px-1 rounded",
                  selectedChannel === tab.id ? "bg-background/20 text-background" : "bg-surface-raised text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Chat Utilities */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
            Discord Bridge Active
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-heading text-background font-mono shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
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
                <div key={msg.id} className="flex items-center gap-2.5 py-1.5 px-1 hover:bg-surface-raised/40 rounded transition-colors group">
                  {/* Timestamp */}
                  <span className="text-[11px] text-muted-foreground shrink-0 w-11 select-none">
                    {msg.timestamp}
                  </span>

                  {/* Author Tag */}
                  <div className="shrink-0 flex items-center gap-1">
                    {msg.role === "bot" ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        <span>{msg.sender}</span>
                        <span className="text-[9px] bg-indigo-500 text-white dark:text-slate-950 px-1 rounded font-bold">BOT</span>
                      </span>
                    ) : msg.role === "server" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {msg.sender}
                      </span>
                    ) : msg.role === "admin" ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                        {msg.sender}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
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
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0 font-mono">
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
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
                4 online
              </span>
            </div>

            {/* Participants List */}
            <div className="space-y-1.5">
              {PARTICIPANTS.map((p) => (
                <div
                  key={p.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-raised/50 border border-border/60 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", p.dotColor)} />
                    <span className="font-semibold text-heading truncate">{p.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">{p.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Moderation Box */}
          <div className="p-3 rounded-lg bg-surface-raised/50 border border-border space-y-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
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
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-semibold"
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
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 font-semibold"
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
