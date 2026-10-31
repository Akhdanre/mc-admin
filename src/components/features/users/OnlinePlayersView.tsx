"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { PlayerInventoryModal } from "./PlayerInventoryModal";
import { MOCK_PLAYERS, type MockPlayerDetail } from "@/lib/mockData";
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
  mockDetail: MockPlayerDetail;
}

const PENPOT_PLAYERS: PlayerRowItem[] = [
  {
    id: "p1",
    initials: "XK",
    avatarColor: "bg-blue-600 text-white",
    username: "_xKaelin",
    role: "Admin",
    roleColor: "bg-blue-600",
    health: "❤ 20/20 HP",
    food: "🍗 20/20",
    dimension: "Overworld",
    coords: "X: 124, Y: 68, Z: -321",
    ping: "18ms",
    pingColor: "bg-emerald-500",
    session: "4h 12m",
    mockDetail: MOCK_PLAYERS[0],
  },
  {
    id: "p2",
    initials: "NF",
    avatarColor: "bg-emerald-600 text-white",
    username: "notch_fan_99",
    role: "Member",
    roleColor: "bg-slate-500",
    health: "❤ 20/20 HP",
    food: "🍗 19/20",
    dimension: "Overworld",
    coords: "X: -810, Y: 63, Z: 412",
    ping: "31ms",
    pingColor: "bg-emerald-500",
    session: "1h 45m",
    mockDetail: MOCK_PLAYERS[1],
  },
  {
    id: "p3",
    initials: "DP",
    avatarColor: "bg-indigo-600 text-white",
    username: "DiamondPick42",
    role: "Moderator",
    roleColor: "bg-indigo-600",
    health: "❤ 18/20 HP",
    food: "🍗 16/20",
    dimension: "Nether",
    coords: "X: -42, Y: 72, Z: 104",
    ping: "42ms",
    pingColor: "bg-emerald-500",
    session: "58m",
    mockDetail: MOCK_PLAYERS[2],
  },
  {
    id: "p4",
    initials: "ES",
    avatarColor: "bg-purple-600 text-white",
    username: "EndermanSlayer",
    role: "VIP+",
    roleColor: "bg-amber-500",
    health: "❤ 20/20 HP",
    food: "🍗 20/20",
    dimension: "The End",
    coords: "X: 0, Y: 64, Z: 0",
    ping: "28ms",
    pingColor: "bg-emerald-500",
    session: "2h 15m",
    mockDetail: MOCK_PLAYERS[3],
  },
  {
    id: "p5",
    initials: "RM",
    avatarColor: "bg-rose-600 text-white",
    username: "RedstoneMaster",
    role: "Member",
    roleColor: "bg-slate-500",
    health: "❤ 14/20 HP",
    food: "🍗 18/20",
    dimension: "Overworld",
    coords: "X: 210, Y: 71, Z: -88",
    ping: "88ms",
    pingColor: "bg-amber-500",
    session: "3h 30m",
    mockDetail: MOCK_PLAYERS[4],
  },
  {
    id: "p6",
    initials: "SB",
    avatarColor: "bg-amber-600 text-white",
    username: "Steve_Builder",
    role: "Member",
    roleColor: "bg-slate-500",
    health: "❤ 20/20 HP",
    food: "🍗 15/20",
    dimension: "Nether",
    coords: "X: -65, Y: 58, Z: 180",
    ping: "115ms",
    pingColor: "bg-rose-500",
    session: "38m",
    isAfk: "• AFK (14m)",
    mockDetail: MOCK_PLAYERS[5] || MOCK_PLAYERS[0],
  },
  {
    id: "p7",
    initials: "HW",
    avatarColor: "bg-slate-700 text-white",
    username: "Herobrine_Watcher",
    role: "Spectator",
    roleColor: "bg-purple-600",
    health: "❤ 20/20 HP",
    food: "🍗 20/20",
    dimension: "Overworld",
    coords: "X: 420, Y: 64, Z: -120",
    ping: "24ms",
    pingColor: "bg-emerald-500",
    session: "1h 10m",
    mockDetail: MOCK_PLAYERS[6] || MOCK_PLAYERS[0],
  },
];

export function OnlinePlayersView({
  livePlayers = [],
  onRefresh,
  isRefreshing = false,
}: OnlinePlayersViewProps) {
  const [search, setSearch] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<MockPlayerDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleInspect = (p: MockPlayerDetail) => {
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

  const filteredPlayers = PENPOT_PLAYERS.filter((p) => {
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

  const overworldCount = PENPOT_PLAYERS.filter((p) => p.dimension === "Overworld").length;
  const netherCount = PENPOT_PLAYERS.filter((p) => p.dimension === "Nether").length;
  const endCount = PENPOT_PLAYERS.filter((p) => p.dimension === "The End").length;

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
            <span className="text-emerald-500 font-bold">●</span> RUNNING · 7 / 20 Online · Peak 18 Today · Whitelist Enforced
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
        <div className="flex items-center h-7 p-0.5 bg-[#eef1f5] dark:bg-surface-raised border border-[#e1e6ed] dark:border-border rounded-[6px]">
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
                  ? "bg-white dark:bg-surface text-[#161b24] dark:text-heading border border-[#cbd3de] dark:border-border shadow-xs font-medium"
                  : "text-[#3a4455] dark:text-muted-foreground hover:text-heading"
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
              className="w-full h-7 bg-white dark:bg-surface-raised border border-[#e1e6ed] dark:border-border rounded-[6px] px-2.5 text-xs text-heading placeholder:text-[#9aa5b5] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
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
            className="h-7 px-3 bg-white dark:bg-surface hover:bg-surface-raised border border-[#cbd3de] dark:border-border rounded-[6px] text-xs font-medium text-[#161b24] dark:text-heading cursor-pointer whitespace-nowrap shadow-xs"
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
                          "w-6.5 h-6.5 rounded flex items-center justify-center text-[10px] font-bold font-mono shrink-0 select-none shadow-xs",
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
                      <span className="text-rose-500 font-medium whitespace-nowrap">
                        {player.health}
                      </span>
                      <span className="text-amber-600 dark:text-amber-500 font-medium whitespace-nowrap">
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
                            "inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold border",
                            player.dimension === "Nether"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                              : player.dimension === "The End"
                              ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                          )}
                        >
                          {player.dimension}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-muted-foreground truncate">
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
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
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
                        onClick={() => handleInspect(player.mockDetail)}
                        className="text-xs h-6.5 px-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
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
