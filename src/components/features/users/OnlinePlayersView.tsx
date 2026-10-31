"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { PlayerInventoryModal } from "./PlayerInventoryModal";
import { MOCK_PLAYERS, type MockPlayerDetail } from "@/lib/mockData";
import { cn } from "@/lib/cn";

export interface OnlinePlayersViewProps {
  livePlayers?: string[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function OnlinePlayersView({
  livePlayers = [],
  onRefresh,
  isRefreshing = false,
}: OnlinePlayersViewProps) {
  const [search, setSearch] = useState("");
  const [dimensionFilter, setDimensionFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<MockPlayerDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerList, setPlayerList] = useState<MockPlayerDetail[]>(() => {
    if (livePlayers.length > 0) {
      // augment with mock details for live players
      return livePlayers.map((name, i) => {
        const existing = MOCK_PLAYERS.find((p) => p.username.toLowerCase() === name.toLowerCase());
        return (
          existing || {
            username: name,
            uuid: `live-uuid-${i}`,
            dimension: "overworld",
            x: 100 + i * 15,
            y: 64,
            z: -200 + i * 20,
            ping: 32,
            role: "member",
            gamemode: "survival",
            health: 20,
            food: 20,
            xpLevel: 10,
            onlineDuration: "12m",
            inventory: [],
          }
        );
      });
    }
    return MOCK_PLAYERS;
  });

  const handleInspect = (p: MockPlayerDetail) => {
    setSelectedPlayer(p);
    setIsModalOpen(true);
  };

  const handleKick = (p: MockPlayerDetail) => {
    setPlayerList((prev) => prev.filter((item) => item.uuid !== p.uuid));
  };

  const handleBan = (p: MockPlayerDetail) => {
    setPlayerList((prev) => prev.filter((item) => item.uuid !== p.uuid));
  };

  const filteredPlayers = playerList.filter((p) => {
    const matchesSearch =
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      p.uuid.toLowerCase().includes(search.toLowerCase());
    const matchesDim =
      dimensionFilter === "all" || p.dimension.toLowerCase().includes(dimensionFilter.toLowerCase());
    return matchesSearch && matchesDim;
  });

  const getDimensionBadge = (dim: string) => {
    if (dim.includes("nether")) {
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    }
    if (dim.includes("end")) {
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    }
    return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Online Players
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-emerald-500 font-bold">●</span> ONLINE · 7 Players Connected · Max 20 · Whitelist Active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs h-8 px-3"
          >
            {isRefreshing ? "Syncing..." : "Sync Player States"}
          </Button>
        </div>
      </div>

      {/* Players Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-surface border border-border p-2.5 rounded-xl">
        <div className="flex flex-1 sm:max-w-xs items-center relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by username or UUID..."
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <SegmentedControl
            size="sm"
            value={dimensionFilter}
            onChange={(val) => setDimensionFilter(val)}
            options={[
              { value: "all", label: "All", badge: playerList.length },
              { value: "overworld", label: "Overworld" },
              { value: "nether", label: "Nether" },
              { value: "end", label: "End" },
            ]}
          />
        </div>
      </div>

      {/* Players Table Card */}
      <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[240px]">Player</TableHead>
              <TableHead>Location & Dimension</TableHead>
              <TableHead>Latency</TableHead>
              <TableHead>Vitals & XP</TableHead>
              <TableHead>Session</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No online players match the selected filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.uuid}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://mc-heads.net/avatar/${player.username}/32`}
                        alt={player.username}
                        className="w-8 h-8 rounded-md bg-surface-raised border border-border shrink-0"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://mc-heads.net/avatar/Steve/32";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-heading truncate">{player.username}</span>
                          <span
                            className={cn(
                              "text-[9px] font-bold uppercase px-1 py-0.2 rounded border",
                              player.role === "admin"
                                ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                            )}
                          >
                            {player.role}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">
                          {player.uuid.slice(0, 18)}...
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium border uppercase",
                          getDimensionBadge(player.dimension)
                        )}
                      >
                        {player.dimension.replace("the_", "")}
                      </span>
                      <span className="font-mono text-xs text-subtle-foreground">
                        {player.x.toFixed(0)}, {player.y.toFixed(0)}, {player.z.toFixed(0)}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          player.ping < 50
                            ? "bg-emerald-500"
                            : player.ping < 100
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        )}
                      />
                      <span className="text-heading font-medium">{player.ping}ms</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-3 text-xs">
                      <span title="Health">❤️ {player.health}/20</span>
                      <span title="Food">🍗 {player.food}/20</span>
                      <span title="XP Level" className="text-emerald-500 font-semibold font-mono">
                        L{player.xpLevel}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground">{player.onlineDuration}</span>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleInspect(player)}
                        className="text-xs h-7 px-2.5"
                      >
                        Lihat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleKick(player)}
                        className="text-xs h-7 px-2 text-warning hover:text-warning"
                      >
                        Kick
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBan(player)}
                        className="text-xs h-7 px-2 text-danger hover:text-danger"
                      >
                        Ban
                      </Button>
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
