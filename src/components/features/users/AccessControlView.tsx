"use client";

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import {
  MOCK_ACCESS_CONTROL,
  type MockWhitelistEntry,
  type MockBanEntry,
  type MockIpBanEntry,
} from "@/lib/mockData";
import { cn } from "@/lib/cn";
import type { WhitelistAction } from "@/types";

export interface AccessControlViewProps {
  onWhitelistAction?: (action: WhitelistAction, username?: string) => Promise<unknown>;
}

export function AccessControlView({ onWhitelistAction }: AccessControlViewProps) {
  const [activeTab, setActiveTab] = useState<"whitelist" | "bans" | "ip">("whitelist");
  const [whitelistEnforced, setWhitelistEnforced] = useState(MOCK_ACCESS_CONTROL.whitelistEnforced);
  const [whitelist, setWhitelist] = useState<MockWhitelistEntry[]>(MOCK_ACCESS_CONTROL.whitelist);
  const [bans, setBans] = useState<MockBanEntry[]>(MOCK_ACCESS_CONTROL.bans);
  const [ipBans, setIpBans] = useState<MockIpBanEntry[]>(MOCK_ACCESS_CONTROL.ipBans);

  // Form states
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newBanName, setNewBanName] = useState("");
  const [newBanReason, setNewBanReason] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPlayerName.trim();
    if (!clean) return;
    const entry: MockWhitelistEntry = {
      username: clean,
      uuid: `mock-uuid-${Date.now()}`,
      addedAt: new Date().toISOString().slice(0, 10),
      addedBy: "Console",
      isOp: false,
    };
    setWhitelist((prev) => [entry, ...prev]);
    setNewPlayerName("");
    try {
      await onWhitelistAction?.("add", clean);
    } catch {
      // offline fallback
    }
  };

  const handleRemoveWhitelist = async (username: string) => {
    setWhitelist((prev) => prev.filter((p) => p.username !== username));
    try {
      await onWhitelistAction?.("remove", username);
    } catch {
      // offline fallback
    }
  };

  const handleAddBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanName.trim()) return;
    const entry: MockBanEntry = {
      username: newBanName.trim(),
      uuid: `ban-uuid-${Date.now()}`,
      reason: newBanReason.trim() || "Violation of server rules",
      bannedBy: "Console",
      bannedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
      expires: "Permanent",
    };
    setBans((prev) => [entry, ...prev]);
    setNewBanName("");
    setNewBanReason("");
  };

  const handleRemoveBan = (username: string) => {
    setBans((prev) => prev.filter((b) => b.username !== username));
  };

  const handleAddIpBan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    const entry: MockIpBanEntry = {
      ip: newIp.trim(),
      reason: newIpReason.trim() || "Suspicious network traffic",
      bannedBy: "Console",
      bannedAt: new Date().toISOString().slice(0, 10),
      country: "Global",
    };
    setIpBans((prev) => [entry, ...prev]);
    setNewIp("");
    setNewIpReason("");
  };

  const handleRemoveIpBan = (ip: string) => {
    setIpBans((prev) => prev.filter((b) => b.ip !== ip));
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Access Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> ENFORCED · Gatekeeper Rules, Whitelist & Security Blacklists
          </p>
        </div>
      </div>

      {/* Access Control Tabs Bar */}
      {/* Access Control Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-surface border border-border p-2.5 rounded-xl">
        <SegmentedControl
          size="md"
          value={activeTab}
          onChange={(val) => setActiveTab(val as typeof activeTab)}
          options={[
            { value: "whitelist", label: "Whitelist", badge: 18 },
            { value: "bans", label: "Active Bans", badge: 4 },
            { value: "ip", label: "IP Blacklist", badge: 1 },
          ]}
        />

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari gamertag, IP atau UUID..."
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Tab: Whitelist */}
      {activeTab === "whitelist" && (
        <div className="space-y-4">
          {/* Quick Add Bar */}
          {/* Whitelist Master Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface border border-border p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <Toggle
                checked={whitelistEnforced}
                onChange={(val) => {
                  setWhitelistEnforced(val);
                  onWhitelistAction?.(val ? "on" : "off").catch(() => {});
                }}
              />
              <div>
                <div className="text-xs font-semibold text-heading">
                  Whitelist Enforcement: {whitelistEnforced ? "ENABLED" : "DISABLED"}
                </div>
                <div className="text-xs text-muted-foreground">
                  Only players on the whitelist or with bypass permission can connect.
                </div>
              </div>
            </div>

            <form onSubmit={handleAddWhitelist} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Minecraft Username..."
                className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-w-[200px]"
              />
              <Button type="submit" variant="primary" size="sm" className="h-8 px-4 text-xs font-medium shrink-0">
                Add to Whitelist
              </Button>
            </form>
          </div>

          {/* Table Header Bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-heading">
              Whitelisted Players ({whitelist.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWhitelistAction?.("reload").catch(() => {})}
              className="text-xs h-7 px-2.5 text-muted-foreground hover:text-heading"
            >
              Reload whitelist.json
            </Button>
          </div>

          {/* Whitelist Table */}
          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[280px]">Player</TableHead>
                  <TableHead>UUID</TableHead>
                  <TableHead>Added Date</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Role / OP</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelist.map((item) => (
                  <TableRow key={item.uuid}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://mc-heads.net/avatar/${item.username}/28`}
                          alt={item.username}
                          className="w-7 h-7 rounded bg-surface-raised border border-border shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://mc-heads.net/avatar/Steve/28";
                          }}
                        />
                        <span className="font-semibold text-heading">{item.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] inline-block">
                        {item.uuid}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-subtle-foreground">{item.addedAt}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-heading">{item.addedBy}</span>
                    </TableCell>
                    <TableCell>
                      {item.isOp ? (
                        <span className="px-1.5 py-0.5 rounded text-overline uppercase bg-warning-surface text-warning-foreground border border-warning-border">
                          Operator
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Standard</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveWhitelist(item.username)}
                          className="text-xs h-6 px-2 text-danger hover:text-danger"
                        >
                          Ban
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveWhitelist(item.username)}
                          className="text-xs h-6 px-2 text-muted-foreground hover:text-danger"
                        >
                          Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab: Active Bans */}
      {activeTab === "bans" && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddBan}
            className="flex flex-col sm:flex-row items-center gap-2 bg-surface border border-border p-3 rounded-xl"
          >
            <input
              type="text"
              value={newBanName}
              onChange={(e) => setNewBanName(e.target.value)}
              placeholder="Username to ban..."
              className="w-full sm:w-48 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <input
              type="text"
              value={newBanReason}
              onChange={(e) => setNewBanReason(e.target.value)}
              placeholder="Reason for ban (e.g. Griefing, X-Ray, Spam)..."
              className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <Button type="submit" variant="danger" size="sm" className="h-8 px-4 text-xs font-medium">
              Execute Ban
            </Button>
          </form>

          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Player</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Banned By</TableHead>
                  <TableHead>Ban Date</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bans.map((ban) => (
                  <TableRow key={ban.uuid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`https://mc-heads.net/avatar/${ban.username}/24`}
                          alt={ban.username}
                          className="w-6 h-6 rounded bg-surface-raised border border-border"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://mc-heads.net/avatar/Steve/24";
                          }}
                        />
                        <span className="font-semibold text-danger">{ban.username}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-heading font-medium">{ban.reason}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{ban.bannedBy}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-subtle-foreground">{ban.bannedAt}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "px-1.5 py-0.2 rounded text-overline border uppercase",
                          ban.expires === "Permanent"
                            ? "bg-danger-surface text-danger-foreground border-danger-border"
                            : "bg-warning-surface text-warning-foreground border-warning-border"
                        )}
                      >
                        {ban.expires}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRemoveBan(ban.username)}
                        className="text-xs h-7 px-2.5"
                      >
                        Unban
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab: IP Blacklist */}
      {activeTab === "ip" && (
        <div className="space-y-4">
          <form
            onSubmit={handleAddIpBan}
            className="flex flex-col sm:flex-row items-center gap-2 bg-surface border border-border p-3 rounded-xl"
          >
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="IP Address or CIDR (e.g. 192.168.1.10 or 10.0.0.0/24)..."
              className="w-full sm:w-64 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <input
              type="text"
              value={newIpReason}
              onChange={(e) => setNewIpReason(e.target.value)}
              placeholder="Reason for firewall block..."
              className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <Button type="submit" variant="danger" size="sm" className="h-8 px-4 text-xs font-medium">
              Block IP
            </Button>
          </form>

          <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">IP / Subnet</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Blocked By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ipBans.map((ipEntry) => (
                  <TableRow key={ipEntry.ip}>
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-danger">
                        {ipEntry.ip}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-heading">{ipEntry.reason}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">{ipEntry.bannedBy}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-subtle-foreground">{ipEntry.bannedAt}</span>
                    </TableCell>
                    <TableCell>
                      <span className="px-1.5 py-0.2 rounded text-overline font-mono bg-surface-raised border border-border">
                        {ipEntry.country || "Global"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRemoveIpBan(ipEntry.ip)}
                        className="text-xs h-7 px-2.5"
                      >
                        Unblock
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
