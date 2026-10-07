"use client";

import { useState, type SubmitEvent } from "react";
import { Badge, Button, Card, Input, Select } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { WhitelistAction, PlayerLocation, PlayerHistoryResponse } from "@/types";

interface UserManagementProps {
  onlinePlayers: string[];
  playerLocations: Record<string, PlayerLocation>;
  whitelistedPlayers: string[];
  whitelistError?: string;
  playerHistory?: PlayerHistoryResponse | null;
  onWhitelistAction: (action: WhitelistAction, username?: string) => Promise<void>;
  onExecuteCommand: (command: string) => Promise<string>;
  onTeleport: (player: string, target?: string, x?: number, y?: number, z?: number) => Promise<void>;
  isBusy: boolean;
}

export function UserManagement({
  onlinePlayers,
  playerLocations,
  whitelistedPlayers,
  whitelistError,
  playerHistory,
  onWhitelistAction,
  onExecuteCommand,
  onTeleport,
  isBusy,
}: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<"online" | "whitelist" | "history">("online");
  const [whitelistInput, setWhitelistInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"all" | "today" | "online">("all");
  const [historySort, setHistorySort] = useState<"lastLoginDesc" | "lastSeenDesc" | "nameAsc">("lastLoginDesc");

  const handleAddWhitelist = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = whitelistInput.trim();
    if (!clean) return;
    await onWhitelistAction("add", clean);
    setWhitelistInput("");
  };

  const handleKickPlayer = async (name: string) => {
    const reason = window.prompt(`Kick ${name} from server? Reason (optional):`, "Kicked by Admin");
    if (reason === null) return;
    await onExecuteCommand(reason.trim() ? `kick ${name} ${reason.trim()}` : `kick ${name}`);
  };

  const handleSetGamemode = async (name: string, mode: string) => {
    await onExecuteCommand(`gamemode ${mode} ${name}`);
  };

  const handleTeleportPrompt = async (name: string) => {
    const target = window.prompt(
      `Teleport ${name} to:\n• Enter another player username (e.g. Steve)\n• Enter coordinates "X Y Z" (e.g. "100 64 -200")\n• Leave blank for World Spawn (0, 0)`
    );
    if (target === null) return;

    const trimmed = target.trim();
    if (!trimmed) {
      await onTeleport(name, undefined, 0, 70, 0);
      return;
    }

    const coords = trimmed.split(/\s+/).map(Number);
    if (coords.length === 3 && !coords.some(isNaN)) {
      await onTeleport(name, undefined, coords[0], coords[1], coords[2]);
    } else {
      await onTeleport(name, trimmed);
    }
  };

  const filteredOnline = onlinePlayers.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredWhitelist = whitelistedPlayers.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredHistory = (playerHistory?.players || [])
    .filter((p) => {
      const matchesSearch = p.username.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (historyFilter === "online") {
        return p.online;
      }

      if (historyFilter === "today") {
        const targetTs = p.lastLoginTimestamp ?? p.lastSeenTimestamp;
        if (!targetTs) return false;
        const date = new Date(targetTs);
        const today = new Date();
        return (
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()
        );
      }

      return true;
    })
    .sort((a, b) => {
      if (historySort === "nameAsc") {
        return a.username.localeCompare(b.username);
      }
      if (historySort === "lastSeenDesc") {
        return (b.lastSeenTimestamp ?? 0) - (a.lastSeenTimestamp ?? 0);
      }
      // default: lastLoginDesc
      return (
        (b.lastLoginTimestamp ?? b.lastSeenTimestamp ?? 0) -
        (a.lastLoginTimestamp ?? a.lastSeenTimestamp ?? 0)
      );
    });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <Card padding="lg" className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge tone="primary" className="mb-2">
            <span>Player Administration & Teleportation</span>
          </Badge>
          <h2 className="text-xl font-bold text-heading tracking-tight">User Management</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor real-time player locations, teleport users, toggle gamemodes, and manage whitelist access.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-overlay p-1 rounded-xl border border-border self-start sm:self-auto">
          <Button
            variant="tab"
            active={activeTab === "online"}
            onClick={() => setActiveTab("online")}
            className="rounded-lg gap-2"
          >
            <span>Active Players</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded-md text-[10px]">
              {onlinePlayers.length}
            </span>
          </Button>
          <Button
            variant="tab"
            active={activeTab === "whitelist"}
            onClick={() => setActiveTab("whitelist")}
            className="rounded-lg gap-2"
          >
            <span>Whitelist Registry</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded-md text-[10px]">
              {whitelistedPlayers.length}
            </span>
          </Button>
          <Button
            variant="tab"
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            className="rounded-lg gap-2"
          >
            <span>Login History</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded-md text-[10px]">
              {playerHistory?.players.length ?? 0}
            </span>
          </Button>
        </div>
      </Card>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            mono
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by username..."
            className="rounded-xl pl-9"
          />
          <svg
            className="w-4 h-4 text-subtle-foreground absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {activeTab === "whitelist" && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="success"
              onClick={() => onWhitelistAction("on")}
              disabled={isBusy}
              className="font-medium"
            >
              Turn On
            </Button>
            <Button
              variant="danger"
              onClick={() => onWhitelistAction("off")}
              disabled={isBusy}
              className="font-medium"
            >
              Turn Off
            </Button>
            <Button
              variant="secondary"
              onClick={() => onWhitelistAction("reload")}
              disabled={isBusy}
              className="font-medium"
            >
              Reload
            </Button>
          </div>
        )}

        {activeTab === "history" && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Pills */}
            <div className="flex bg-overlay p-1 rounded-xl border border-border text-xs">
              <Button
                variant="tab"
                active={historyFilter === "all"}
                onClick={() => setHistoryFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium",
                  historyFilter === "all" && "bg-surface-raised text-heading"
                )}
              >
                All
              </Button>
              <Button
                variant="tab"
                active={historyFilter === "today"}
                onClick={() => setHistoryFilter("today")}
                className="px-2.5 py-1 rounded-lg font-medium"
              >
                Today
              </Button>
              <Button
                variant="tab"
                active={historyFilter === "online"}
                onClick={() => setHistoryFilter("online")}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-medium",
                  historyFilter === "online" && "bg-emerald-600"
                )}
              >
                Online
              </Button>
            </div>

            {/* Sort Dropdown */}
            <Select
              value={historySort}
              onChange={(e) =>
                setHistorySort(
                  e.target.value as "lastLoginDesc" | "lastSeenDesc" | "nameAsc"
                )
              }
              className="rounded-xl px-2.5 py-1.5"
            >
              <option value="lastLoginDesc">Sort: Last Login (Newest)</option>
              <option value="lastSeenDesc">Sort: Last Seen (Newest)</option>
              <option value="nameAsc">Sort: Name (A–Z)</option>
            </Select>
          </div>
        )}
      </div>

      {/* Online Players Tab */}
      {activeTab === "online" && (
        <div className="space-y-4">
          {filteredOnline.length === 0 ? (
            <Card tone="muted" padding="lg" className="p-12 text-center">
              <span className="text-3xl">👥</span>
              <p className="text-sm font-semibold text-foreground mt-2">
                {searchQuery ? "No matching online players found" : "No players currently online"}
              </p>
              <p className="text-xs text-subtle-foreground mt-1">
                When players connect to your server, they will appear here with live coordinates and teleport controls.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOnline.map((name) => {
                const loc = playerLocations[name];
                return (
                  <Card
                    key={name}
                    padding="sm"
                    className="flex flex-col justify-between hover:border-border-strong transition"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://mc-heads.net/avatar/${name}/44`}
                            alt={name}
                            className="w-11 h-11 rounded-xl bg-surface-raised"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                "https://mc-heads.net/avatar/Steve/44";
                            }}
                          />
                          <div>
                            <h4 className="font-bold text-heading text-sm">{name}</h4>
                            <span className="inline-flex items-center gap-1 text-[11px] text-success-muted font-medium mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="primary"
                            onClick={() => handleTeleportPrompt(name)}
                            disabled={isBusy}
                            title="Teleport player"
                            className="px-2.5 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg"
                          >
                            <span>🌀</span>
                            <span>TP</span>
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleKickPlayer(name)}
                            disabled={isBusy}
                            title="Kick player"
                            className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-danger-muted border border-rose-500/20 rounded-lg"
                          >
                            Kick
                          </Button>
                        </div>
                      </div>

                      {/* Live Coordinates Pill */}
                      {loc && (
                        <div className="mt-3 p-2 bg-background/80 border border-border/60 rounded-xl flex items-center justify-between text-xs font-mono">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <span>📍</span>
                            <span className="capitalize">{loc.dimension}</span>
                          </span>
                          <span className="text-indigo-300 font-semibold">
                            X: {loc.x} Y: {loc.y} Z: {loc.z}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Player Actions */}
                    <div className="mt-4 pt-3 border-t border-border/80 flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-muted-foreground font-medium">Mode:</span>
                        <Button
                          variant="ghost"
                          onClick={() => handleSetGamemode(name, "survival")}
                          className="text-[10px] px-2 py-0.5 bg-surface-raised hover:bg-surface-elevated text-foreground rounded font-mono transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Surv
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleSetGamemode(name, "creative")}
                          className="text-[10px] px-2 py-0.5 bg-surface-raised hover:bg-surface-elevated text-foreground rounded font-mono transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Crea
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => handleSetGamemode(name, "spectator")}
                          className="text-[10px] px-2 py-0.5 bg-surface-raised hover:bg-surface-elevated text-foreground rounded font-mono transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Spec
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => onExecuteCommand(`tp ${name} 0 ~ 0`)}
                          className="text-[11px] text-primary-muted hover:text-indigo-300 font-medium bg-transparent"
                        >
                          To Spawn
                        </Button>
                        <span className="text-slate-700">•</span>
                        <Button
                          variant="ghost"
                          onClick={() => onExecuteCommand(`kill ${name}`)}
                          className="text-[11px] text-muted-foreground hover:text-danger-muted bg-transparent"
                        >
                          Kill
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Whitelist Tab */}
      {activeTab === "whitelist" && (
        <div className="space-y-6">
          <Card padding="sm">
            <form onSubmit={handleAddWhitelist} className="flex gap-2">
              <Input
                type="text"
                mono
                maxLength={16}
                value={whitelistInput}
                onChange={(e) => setWhitelistInput(e.target.value)}
                placeholder="Enter Minecraft username to whitelist (e.g. Notch, Alex)..."
                disabled={isBusy}
                className="flex-1 rounded-xl"
              />
              <Button
                type="submit"
                variant="success"
                size="md"
                disabled={isBusy || !whitelistInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5 shadow-sm"
              >
                <span>+ Add to Whitelist</span>
              </Button>
            </form>
          </Card>

          {whitelistError ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-danger-muted p-4 rounded-xl text-xs font-mono">
              {whitelistError}
            </div>
          ) : filteredWhitelist.length === 0 ? (
            <Card tone="muted" padding="lg" className="p-12 text-center">
              <span className="text-3xl">🛡️</span>
              <p className="text-sm font-semibold text-foreground mt-2">
                {searchQuery ? "No matching whitelisted players found" : "No players in whitelist"}
              </p>
              <p className="text-xs text-subtle-foreground mt-1">
                Add usernames above to restrict server access to approved players only.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredWhitelist.map((name) => (
                <Card
                  key={name}
                  padding="none"
                  className="flex items-center justify-between p-3.5 rounded-xl hover:border-border-strong transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://mc-heads.net/avatar/${name}/36`}
                      alt={name}
                      className="w-9 h-9 rounded-lg bg-surface-raised shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://mc-heads.net/avatar/Steve/36";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-heading truncate">{name}</p>
                      <p className="text-xs text-primary-muted font-medium">Whitelisted</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (window.confirm(`Remove ${name} from whitelist?`)) {
                        onWhitelistAction("remove", name);
                      }
                    }}
                    disabled={isBusy}
                    title="Remove user"
                    className="p-1.5 text-muted-foreground hover:text-danger-muted hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 bg-transparent"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Login History Tab */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <Card tone="muted" padding="lg" className="p-12 text-center">
              <span className="text-3xl">📜</span>
              <p className="text-sm font-semibold text-foreground mt-2">
                {searchQuery ? "No matching players found" : "No login records found"}
              </p>
              <p className="text-xs text-subtle-foreground mt-1">
                Player login times and last seen timestamps will be indexed as players connect.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredHistory.map((player) => (
                <Card
                  key={player.username}
                  padding="sm"
                  className="flex flex-col justify-between hover:border-border-strong transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://mc-heads.net/avatar/${player.username}/44`}
                        alt={player.username}
                        className="w-11 h-11 rounded-xl bg-surface-raised shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://mc-heads.net/avatar/Steve/44";
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-heading text-sm">{player.username}</h4>
                        {player.online ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-success-muted font-medium mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online Now
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-medium mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            Offline
                          </span>
                        )}
                      </div>
                    </div>

                    {player.uuid && (
                      <span className="text-[10px] font-mono text-subtle-foreground bg-background/80 px-2 py-1 rounded-md border border-slate-850 truncate max-w-[120px]" title={player.uuid}>
                        {player.uuid.slice(0, 8)}...
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span>🕒</span>
                        <span>Last Login:</span>
                      </span>
                      <span className="text-indigo-300 font-medium">
                        {player.lastLogin
                          ? new Date(player.lastLogin).toLocaleString()
                          : "Recorded in playerdata"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span>🚪</span>
                        <span>Last Seen / Logout:</span>
                      </span>
                      <span className="text-foreground font-medium">
                        {player.lastSeen
                          ? new Date(player.lastSeen).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
