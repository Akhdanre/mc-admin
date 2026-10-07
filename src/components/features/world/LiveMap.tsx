"use client";

import { useState, type SubmitEvent } from "react";
import { Button, Card, Badge, Input } from "@/components/ui";

interface LiveMapProps {
  mapUrl?: string;
}

export function LiveMap({ mapUrl = "http://192.168.137.194:8123" }: LiveMapProps) {
  const [currentUrl, setCurrentUrl] = useState(mapUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInput, setCustomInput] = useState(mapUrl);

  const handleSaveUrl = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (customInput.trim()) {
      setCurrentUrl(customInput.trim());
      setIsEditingUrl(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      {/* Map Control Bar */}
      <Card
        tone="panel"
        padding="sm"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-lg">🗺️</div>
          <div>
            <h2 className="text-base font-bold text-heading tracking-tight flex items-center gap-2">
              <span>Dynmap Live Web Map</span>
              <Badge tone="success" className="text-[10px] font-mono">
                Port 8123
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">Live 2D / isometric world viewer and real-time player locations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingUrl ? (
            <form onSubmit={handleSaveUrl} className="flex gap-1.5">
              <Input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="http://..."
                mono
                className="w-auto px-2.5 py-1"
              />
              <Button type="submit" variant="primary">
                Save
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsEditingUrl(false)}
                className="bg-transparent px-2 py-1"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button
              variant="ghost"
              onClick={() => setIsEditingUrl(true)}
              className="bg-background border border-border rounded-xl"
            >
              Config URL
            </Button>
          )}

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 bg-surface-raised hover:bg-surface-elevated text-foreground border border-border-strong rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open in New Tab</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </Card>

      {/* Embed Frame */}
      <div className="flex-1 bg-background rounded-2xl border border-border overflow-hidden shadow-2xl relative">
        <iframe
          src={currentUrl}
          title="Minecraft Dynmap"
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
