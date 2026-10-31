"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { PlayerInventoryModal } from "./PlayerInventoryModal";
import type { PlayerDetail } from "@/types";
import { cn } from "@/lib/cn";

export interface OnlinePlayersViewProps {
  livePlayers?: string[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

interface PlayerRowItem {
  id: string;
  initials: string;
  avatarColor: string;
  username: string;
  role: "Admin" | "Moderator" | "VIP+" | "Member" | "Spectator";
  roleColor: string;
  health: string;
  food: string;
  dimension: "Overworld" | "Nether" | "The End";
  coords: string;
  ping: string;
  pingColor: string;
  session: string;
  isAfk?: string;
  detail: PlayerDetail;
}



export function OnlinePlayersView({
  livePlayers = [],
  onRefresh,
  isRefreshing = false,
}: OnlinePlayersViewProps) {
  const [search, setSearch] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const playerItems: PlayerRowItem[] = livePlayers.map((name, idx) => ({
    id: `live-${idx}`,
    initials: name.slice(0, 2).toUpperCase(),
    avatarColor: "bg-primary text-primary-foreground",
    username: name,
    role: "Member",
    roleColor: "bg-primary/20 text-primary",
    health: "20/20 HP",
    food: "20/20",
    dimension: "Overworld",
    coords: "X: 0, Y: 64, Z: 0",
    ping: "24ms",
    pingColor: "bg-success",
    session: "Active",
    detail: {
      uuid: `uuid-${name}`,
      username: name,
      dimension: "Overworld",
      coords: { x: 0, y: 64, z: 0 },
      pingMs: 24,
      role: "Member",
      health: 20,
      food: 20,
      gamemode: "survival",
      xpLevel: 30,
      inventory: [],
      armor: {},
    },
  }));

  const handleInspect = (p: PlayerDetail) => {
    setSelectedPlayer(p);
    setIsModalOpen(true);
  };

  const handleKick = (username: string) => {
    setActionMenuOpen(null);
    setActionNotice(`Player ${username} kicked from server.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleBan = (username: string) => {
    setActionMenuOpen(null);
    setActionNotice(`Player ${username} banned.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleTeleport = (username: string) => {
    setActionMenuOpen(null);
    setActionNotice(`Teleported to ${username}.`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const filteredPlayers = playerItems.filter((p) => {
    const matchesSearch =
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.role.toLowerCase().includes(search.toLowerCase()) ||
      p.coords.toLowerCase().includes(search.toLowerCase());

    const matchesDim =
      dimensionFilter === "all" ||
      (dimensionFilter === "overworld" && p.dimension === "Overworld") ||
      (dimensionFilter === "nether" && p.dimension === "Nether") ||
      (dimensionFilter === "end" && p.dimension === "The End");

    return matchesSearch && matchesDim;
  });

  const overworldCount = playerItems.filter((p) => p.dimension === "Overworld").length;
  const netherCount = playerItems.filter((p) => p.dimension === "Nether").length;
  const endCount = playerItems.filter((p) => p.dimension === "The End").length;

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-subtle-foreground hover:text-foreground cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Online Players
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> RUNNING · 7 / 20 Online · Peak 18 Today · Whitelist Enforced
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs h-8 px-3"
          >
            {isRefreshing ? "Syncing..." : "Sync Player States"}
          </Button>
        </div>
      </div>

      {/* Players Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Dimension Segmented Filter */}
        <div className="flex items-center h-7 p-0.5 bg-surface-raised border border-border rounded-[6px]">
          {[
            { id: "all", label: "All Players (7)" },
            { id: "overworld", label: "Overworld (4)" },
            { id: "nether", label: "Nether (2)" },
            { id: "end", label: "The End (1)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDimensionFilter(tab.id)}
              className={cn(
                "h-[22px] px-2.5 rounded-[4px] text-xs transition-colors whitespace-nowrap cursor-pointer flex items-center justify-center font-medium",
                dimensionFilter === tab.id
                  ? "bg-surface text-heading border border-border-strong shadow-xs font-medium"
                  : "text-muted-foreground hover:text-heading"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Toolbar Right Actions */}
        <div className="flex items-center gap-2">
          <div className="w-full sm:w-[220px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari gamertag, IP, atau UUID..."
              className="w-full h-7 bg-surface border border-border rounded-[6px] px-2.5 text-xs text-heading placeholder:text-subtle-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const msg = window.prompt("Enter broadcast message to all connected players:");
              if (msg) {
                setActionNotice(`Broadcasted: "${msg}"`);
                setTimeout(() => setActionNotice(null), 3000);
              }
            }}
            className="h-7 px-3 bg-surface hover:bg-surface-raised border border-border rounded-[6px] text-xs font-medium text-heading cursor-pointer whitespace-nowrap shadow-xs"
          >
            Broadcast Msg
          </button>
        </div>
      </div>

      {/* Players Table Card */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[230px]">PLAYER / GAMERTAG</TableHead>
              <TableHead className="w-[120px]">RANK / ROLE</TableHead>
              <TableHead className="w-[150px]">HEALTH & HUNGER</TableHead>
              <TableHead className="w-[220px]">WORLD & COORDS</TableHead>
              <TableHead className="w-[110px]">PING (RTT)</TableHead>
              <TableHead className="w-[120px]">SESSION & AFK</TableHead>
              <TableHead className="text-right w-[114px]">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No online players match the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  {/* PLAYER / GAMERTAG */}
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div
                        className={cn(
                          "w-6.5 h-6.5 rounded flex items-center justify-center text-overline font-mono shrink-0 select-none shadow-xs",
                          player.avatarColor
                        )}
                      >
                        {player.initials}
                      </div>
                      <span className="font-semibold text-xs text-heading truncate">
                        {player.username}
                      </span>
                    </div>
                  </TableCell>

                  {/* RANK / ROLE */}
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", player.roleColor)} />
                      <span className="text-xs font-medium text-heading">
                        {player.role}
                      </span>
                    </div>
                  </TableCell>

                  {/* HEALTH & HUNGER */}
                  <TableCell>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-danger font-medium whitespace-nowrap">
                        {player.health}
                      </span>
                      <span className="text-warning-foreground font-medium whitespace-nowrap">
                        {player.food}
                      </span>
                    </div>
                  </TableCell>

                  {/* WORLD & COORDS */}
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div>
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.2 rounded text-overline border",
                            player.dimension === "Nether"
                              ? "bg-danger-surface text-danger-foreground border-danger-border"
                              : player.dimension === "The End"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-info-surface text-info-foreground border-info-border"
                          )}
                        >
                          {player.dimension}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground truncate">
                        {player.coords}
                      </span>
                    </div>
                  </TableCell>

                  {/* PING (RTT) */}
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", player.pingColor)} />
                      <span className="text-heading font-medium">{player.ping}</span>
                    </div>
                  </TableCell>

                  {/* SESSION & AFK */}
                  <TableCell>
                    <div className="flex flex-col text-xs font-mono">
                      <span className="text-heading">{player.session}</span>
                      {player.isAfk && (
                        <span className="text-overline text-muted-foreground whitespace-nowrap">
                          {player.isAfk}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell className="text-right">
                    <div className="relative inline-flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInspect(player.detail)}
                        className="text-xs h-6.5 px-2.5 bg-info-surface text-info-foreground border-info-border hover:bg-info/20"
                      >
                        Inspect
                      </Button>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActionMenuOpen(actionMenuOpen === player.id ? null : player.id)
                          }
                          className="h-6.5 w-6.5 rounded flex items-center justify-center text-xs text-muted-foreground hover:text-heading bg-surface border border-border hover:bg-surface-raised cursor-pointer"
                          title="More actions"
                        >
                          ⋮
                        </button>

                        {actionMenuOpen === player.id && (
                          <div className="absolute right-0 top-8 z-30 w-32 bg-surface border border-border rounded-lg shadow-md py-1 text-left text-xs font-mono">
                            <button
                              onClick={() => handleTeleport(player.username)}
                              className="w-full px-3 py-1.5 hover:bg-surface-raised text-heading text-left cursor-pointer"
                            >
                              Teleport
                            </button>
                            <button
                              onClick={() => handleKick(player.username)}
                              className="w-full px-3 py-1.5 hover:bg-surface-raised text-warning text-left cursor-pointer"
                            >
                              Kick
                            </button>
                            <button
                              onClick={() => handleBan(player.username)}
                              className="w-full px-3 py-1.5 hover:bg-surface-raised text-danger text-left cursor-pointer"
                            >
                              Ban
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Inventory Inspector Modal */}
      <PlayerInventoryModal
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
