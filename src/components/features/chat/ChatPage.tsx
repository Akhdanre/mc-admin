"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePolling } from "@/hooks/usePolling";
import { Card, Button, Input, SectionTitle, Muted, Badge } from "@/components/ui";
import type { ChatMessage, ChatResponse } from "@/types";

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchChat = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      if (!res.ok) return;
      const data = (await res.json()) as ChatResponse;
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch {
      // silent polling failure
    }
  }, []);

  // Background fallback poll (every 10s if SSE is active, every 3s if disconnected)
  usePolling(fetchChat, isLive ? 10000 : 3000);

  // Realtime Server-Sent Events (SSE) listener
  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("/api/chat/stream");

      es.onopen = () => {
        setIsLive(true);
      };

      es.onmessage = (event) => {
        if (!event.data || event.data.startsWith(":")) return;
        try {
          const msg = JSON.parse(event.data) as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
        } catch {
          // Non-JSON or comment line
        }
      };

      es.onerror = () => {
        setIsLive(false);
      };
    } catch {
      // EventSource failed to instantiate, fallback polling continues
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, []);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send message");
      } else {
        setInputText("");
        await fetchChat();
      }
    } catch {
      setError("Network error sending message");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4 max-w-5xl h-[calc(100vh-8rem)] flex flex-col">
      {/* Header Bar */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <SectionTitle className="text-lg font-bold">In-Game Chat</SectionTitle>
            <Badge
              tone={isLive ? "success" : "neutral"}
              className="px-2 py-0.5 text-[11px] font-medium"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  isLive ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                }`}
              />
              {isLive ? "Realtime (SSE)" : "Polling"}
            </Badge>
          </div>
          <Muted className="text-xs mt-0.5">
            Instant player conversation feed and server broadcasting
          </Muted>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary/40"
            />
            Auto-scroll
          </label>
          <Button variant="secondary" size="sm" onClick={fetchChat}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Chat Messages Feed - Fixed dark style per design system rules */}
      <Card className="flex-1 flex flex-col min-h-0 bg-slate-950/90 border-slate-800 text-slate-100 overflow-hidden shadow-inner">
        <div className="flex-1 p-4 overflow-y-auto space-y-2.5 font-mono text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
              <span className="text-2xl mb-2">💬</span>
              <p>No chat messages recorded yet in current server log.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 p-1.5 rounded-lg transition-colors ${
                  msg.isServer
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-200"
                    : "hover:bg-slate-900/60"
                }`}
              >
                <span className="text-slate-500 text-[11px] shrink-0 select-none">
                  [{msg.timestamp.split(" ")[1] || msg.timestamp}]
                </span>

                {msg.isServer ? (
                  <Badge tone="warning" className="px-1.5 py-0 text-[10px] uppercase">
                    Server
                  </Badge>
                ) : (
                  <span className="font-semibold text-indigo-400 shrink-0">
                    &lt;{msg.sender}&gt;
                  </span>
                )}

                <span className="break-words flex-1 text-slate-200">
                  {msg.message}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2 shrink-0"
        >
          <Input
            type="text"
            placeholder="Broadcast message to Minecraft server (/say)..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
            className="flex-1 bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 text-xs"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={isSending || !inputText.trim()}
            className="shrink-0 text-xs px-4"
          >
            {isSending ? "Sending..." : "Broadcast"}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          {error}
        </div>
      )}
    </div>
  );
}
