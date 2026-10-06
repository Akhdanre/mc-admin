"use client";

import { useState, type SubmitEvent } from "react";
import type { WhitelistAction } from "@/types";
import { Button, Card, Badge, Input } from "@/components/ui";

interface WhitelistManagerProps {
  players: string[];
  errorMessage?: string;
  onAction: (action: WhitelistAction, username?: string) => Promise<void>;
  isLoading: boolean;
}

export function WhitelistManager({
  players,
  errorMessage,
  onAction,
  isLoading,
}: WhitelistManagerProps) {
  const [usernameInput, setUsernameInput] = useState("");

  const handleAdd = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = usernameInput.trim();
    if (!clean) return;
    await onAction("add", clean);
    setUsernameInput("");
  };

  const handleRemove = async (username: string) => {
    if (!window.confirm(`Remove ${username} from whitelist?`)) return;
    await onAction("remove", username);
  };

  return (
    <Card className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-heading flex items-center gap-2">
            <span>Whitelist Access Management</span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">Control player access and grant entry to whitelisted users.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="success"
            onClick={() => onAction("on")}
            disabled={isLoading}
          >
            Turn On
          </Button>
          <Button
            variant="danger"
            onClick={() => onAction("off")}
            disabled={isLoading}
          >
            Turn Off
          </Button>
          <Button
            variant="secondary"
            onClick={() => onAction("reload")}
            disabled={isLoading}
          >
            Reload
          </Button>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <Input
          type="text"
          maxLength={16}
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder="Minecraft username (e.g. Notch, Steve)"
          disabled={isLoading}
          mono
          className="flex-1 text-sm py-2"
        />
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isLoading}
        >
          <span>+ Add to Whitelist</span>
        </Button>
      </form>

      {errorMessage ? (
        <Card tone="muted" padding="none" className="text-center py-10 border-rose-900/50">
          <p className="text-danger-muted text-sm">{errorMessage}</p>
        </Card>
      ) : players.length === 0 ? (
        <Card tone="muted" padding="none" className="text-center py-10">
          <p className="text-muted-foreground text-sm">No players currently in whitelist.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((name) => (
            <Card
              key={name}
              tone="solid"
              padding="none"
              className="flex items-center justify-between p-3 bg-background/80 border-border rounded-lg hover:border-border-strong"
            >
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://mc-heads.net/avatar/${name}/36`}
                  alt={name}
                  className="w-9 h-9 rounded-md bg-surface-raised"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://mc-heads.net/avatar/Steve/36";
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-heading">{name}</p>
                  <Badge tone="primary" className="mt-0.5">Whitelisted</Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleRemove(name)}
                disabled={isLoading}
                title="Remove user"
                className="p-1.5 rounded hover:text-danger-muted hover:bg-rose-500/10 hover:border-rose-500/20 border border-transparent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
