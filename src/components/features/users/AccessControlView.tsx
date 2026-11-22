"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/cn";
import { apiGet, apiPost } from "@/lib/api";
import { MOCK_ACCESS_CONTROL } from "@/lib/mockData";
import type {
  WhitelistAction,
  WhitelistEntry,
  BanEntry,
  IpBanEntry,
  AccessControlData,
} from "@/types";

export interface AccessControlViewProps {
  onWhitelistAction?: (action: WhitelistAction, username?: string) => Promise<unknown>;
}

export function AccessControlView({ onWhitelistAction }: AccessControlViewProps) {
  const [activeTab, setActiveTab] = useState<"whitelist" | "bans" | "ip">("whitelist");
  const [whitelistEnforced, setWhitelistEnforced] = useState(true);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [ipBans, setIpBans] = useState<IpBanEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newBanName, setNewBanName] = useState("");
  const [newBanReason, setNewBanReason] = useState("");
  const [newIp, setNewIp] = useState("");
  const [newIpReason, setNewIpReason] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const data = await apiGet<AccessControlData>("/api/access");
      if (data && Array.isArray(data.whitelist)) {
        setWhitelist(data.whitelist);
        setWhitelistEnforced(Boolean(data.whitelistEnforced));
        setBans(Array.isArray(data.bans) ? data.bans : []);
        setIpBans(Array.isArray(data.ipBans) ? data.ipBans : []);
        return;
      }
    } catch {
      // offline fallback to mock data
    }

    setWhitelistEnforced(MOCK_ACCESS_CONTROL.whitelistEnforced);
    setWhitelist(MOCK_ACCESS_CONTROL.whitelist);
    setBans(MOCK_ACCESS_CONTROL.bans);
    setIpBans(MOCK_ACCESS_CONTROL.ipBans);
  }, []);

  useEffect(() => {
    let ignore = false;
    apiGet<AccessControlData>("/api/access")
      .then((data) => {
        if (!ignore && data && Array.isArray(data.whitelist)) {
          setWhitelist(data.whitelist);
          setWhitelistEnforced(Boolean(data.whitelistEnforced));
          setBans(Array.isArray(data.bans) ? data.bans : []);
          setIpBans(Array.isArray(data.ipBans) ? data.ipBans : []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setWhitelistEnforced(MOCK_ACCESS_CONTROL.whitelistEnforced);
          setWhitelist(MOCK_ACCESS_CONTROL.whitelist);
          setBans(MOCK_ACCESS_CONTROL.bans);
          setIpBans(MOCK_ACCESS_CONTROL.ipBans);
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const showStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleAddWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newPlayerName.trim();
    if (!clean) return;

    setIsSubmitting(true);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: "add",
        username: clean,
      });

      if (res?.data) {
        setWhitelist(res.data.whitelist);
      } else {
        const entry: WhitelistEntry = {
          username: clean,
          uuid: `offline-${Date.now()}`,
          addedAt: new Date().toISOString().slice(0, 10),
          addedBy: "Console",
          isOp: false,
        };
        setWhitelist((prev) => [entry, ...prev]);
      }
      setNewPlayerName("");
      showStatus(res?.result || `Added ${clean} to whitelist`);
      await onWhitelistAction?.("add", clean).catch(() => {});
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to add player to whitelist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWhitelist = async (username: string) => {
    setIsSubmitting(true);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: "remove",
        username,
      });

      if (res?.data) {
        setWhitelist(res.data.whitelist);
      } else {
        setWhitelist((prev) => prev.filter((p) => p.username !== username));
      }
      showStatus(res?.result || `Removed ${username} from whitelist`);
      await onWhitelistAction?.("remove", username).catch(() => {});
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to remove player");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleEnforcement = async (val: boolean) => {
    setWhitelistEnforced(val);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: val ? "on" : "off",
      });
      if (res?.data) {
        setWhitelistEnforced(res.data.whitelistEnforced);
      }
      showStatus(res?.result || `Whitelist enforcement ${val ? "enabled" : "disabled"}`);
      await onWhitelistAction?.(val ? "on" : "off").catch(() => {});
    } catch {
      // rollback if failed
      setWhitelistEnforced(!val);
    }
  };

  const handleReloadWhitelist = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: "reload",
      });
      if (res?.data) {
        setWhitelist(res.data.whitelist);
      } else {
        await fetchData();
      }
      showStatus(res?.result || "whitelist.json reloaded from disk");
      await onWhitelistAction?.("reload").catch(() => {});
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to reload whitelist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newBanName.trim();
    if (!cleanName) return;
    const cleanReason = newBanReason.trim() || "Violation of server rules";

    setIsSubmitting(true);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: "ban",
        username: cleanName,
        reason: cleanReason,
      });

      if (res?.data) {
        setBans(res.data.bans);
      } else {
        const entry: BanEntry = {
          username: cleanName,
          uuid: `ban-${Date.now()}`,
          reason: cleanReason,
          bannedBy: "Console",
          bannedAt: new Date().toISOString().slice(0, 16).replace("T", " "),
          expires: "Permanent",
        };
        setBans((prev) => [entry, ...prev]);
      }
      setNewBanName("");
      setNewBanReason("");
      showStatus(res?.result || `Banned player ${cleanName}`);
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to ban player");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBan = async (username: string) => {
    setIsSubmitting(true);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: "unban",
        username,
      });

      if (res?.data) {
        setBans(res.data.bans);
      } else {
        setBans((prev) => prev.filter((b) => b.username !== username));
      }
      showStatus(res?.result || `Pardoned player ${username}`);
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to unban player");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBanFromWhitelist = async (username: string) => {
    if (!window.confirm(`Are you sure you want to BAN ${username} and remove from whitelist?`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await apiPost("/api/access", {
        action: "ban",
        username,
        reason: "Banned via Access Control Suite",
      });
      await apiPost("/api/access", {
        action: "remove",
        username,
      });
      await fetchData();
      showStatus(`Banned and removed ${username}`);
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to ban player");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddIpBan = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIp = newIp.trim();
    if (!cleanIp) return;
    const cleanReason = newIpReason.trim() || "Suspicious network traffic";

    setIsSubmitting(true);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: "ban-ip",
        ip: cleanIp,
        reason: cleanReason,
      });

      if (res?.data) {
        setIpBans(res.data.ipBans);
      } else {
        const entry: IpBanEntry = {
          ip: cleanIp,
          reason: cleanReason,
          bannedBy: "Console",
          bannedAt: new Date().toISOString().slice(0, 10),
          country: "Global",
        };
        setIpBans((prev) => [entry, ...prev]);
      }
      setNewIp("");
      setNewIpReason("");
      showStatus(res?.result || `Blocked IP address ${cleanIp}`);
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to block IP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveIpBan = async (ip: string) => {
    setIsSubmitting(true);
    try {
      const res = await apiPost<{ result: string; data?: AccessControlData }>("/api/access", {
        action: "unban-ip",
        ip,
      });

      if (res?.data) {
        setIpBans(res.data.ipBans);
      } else {
        setIpBans((prev) => prev.filter((b) => b.ip !== ip));
      }
      showStatus(res?.result || `Unblocked IP address ${ip}`);
    } catch (err) {
      showStatus(err instanceof Error ? err.message : "Failed to unblock IP");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter lists based on search query
  const queryLower = searchQuery.toLowerCase().trim();

  const filteredWhitelist = whitelist.filter((item) => {
    if (!queryLower) return true;
    return (
      item.username.toLowerCase().includes(queryLower) ||
      item.uuid.toLowerCase().includes(queryLower)
    );
  });

  const filteredBans = bans.filter((ban) => {
    if (!queryLower) return true;
    return (
      ban.username.toLowerCase().includes(queryLower) ||
      ban.uuid.toLowerCase().includes(queryLower) ||
      ban.reason.toLowerCase().includes(queryLower)
    );
  });

  const filteredIpBans = ipBans.filter((ipEntry) => {
    if (!queryLower) return true;
    return (
      ipEntry.ip.toLowerCase().includes(queryLower) ||
      ipEntry.reason.toLowerCase().includes(queryLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Access Control
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span
              className={whitelistEnforced ? "text-success font-bold" : "text-muted-foreground"}
            >
              ●
            </span>{" "}
            {whitelistEnforced ? "ENFORCED" : "OPEN"} · Gatekeeper Rules, Whitelist & Security
            Blacklists
          </p>
        </div>

        <div className="flex items-center gap-2">
          {statusMessage && (
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-surface border border-border text-heading shadow-xs animate-in fade-in duration-200">
              {statusMessage}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsLoading(true);
              fetchData().finally(() => setIsLoading(false));
            }}
            disabled={isLoading || isSubmitting}
            className="text-xs h-8 px-3"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Access Control Tabs Bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-surface border border-border p-2.5 rounded-xl">
        <SegmentedControl
          size="md"
          value={activeTab}
          onChange={(val) => setActiveTab(val as typeof activeTab)}
          options={[
            { value: "whitelist", label: "Whitelist", badge: whitelist.length },
            { value: "bans", label: "Active Bans", badge: bans.length },
            { value: "ip", label: "IP Blacklist", badge: ipBans.length },
          ]}
        />

        <div className="w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari gamertag, IP atau UUID..."
            className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Tab: Whitelist */}
      {activeTab === "whitelist" && (
        <div className="space-y-4">
          {/* Whitelist Master Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface border border-border p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <Toggle
                checked={whitelistEnforced}
                onChange={handleToggleEnforcement}
                disabled={isSubmitting}
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

            <form
              onSubmit={handleAddWhitelist}
              className="flex items-center gap-2 w-full md:w-auto"
            >
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Minecraft Username..."
                disabled={isSubmitting}
                className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-w-[200px]"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmitting || !newPlayerName.trim()}
                className="h-8 px-4 text-xs font-medium shrink-0"
              >
                Add to Whitelist
              </Button>
            </form>
          </div>

          {/* Table Header Bar */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-semibold text-heading">
              Whitelisted Players ({filteredWhitelist.length})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReloadWhitelist}
              disabled={isSubmitting}
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
                {filteredWhitelist.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      {searchQuery
                        ? "Tidak ada player yang sesuai dengan filter pencarian."
                        : "Tidak ada player dalam whitelist server."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWhitelist.map((item) => (
                    <TableRow key={item.uuid || item.username}>
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
                          {item.uuid || "—"}
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
                            onClick={() => handleBanFromWhitelist(item.username)}
                            disabled={isSubmitting}
                            className="text-xs h-6 px-2 text-danger hover:text-danger hover:bg-danger-surface"
                          >
                            Ban
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveWhitelist(item.username)}
                            disabled={isSubmitting}
                            className="text-xs h-6 px-2 text-muted-foreground hover:text-danger"
                          >
                            Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
              disabled={isSubmitting}
              className="w-full sm:w-48 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <input
              type="text"
              value={newBanReason}
              onChange={(e) => setNewBanReason(e.target.value)}
              placeholder="Reason for ban (e.g. Griefing, X-Ray, Spam)..."
              disabled={isSubmitting}
              className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isSubmitting || !newBanName.trim()}
              className="h-8 px-4 text-xs font-medium"
            >
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
                {filteredBans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      {searchQuery
                        ? "Tidak ada banned player yang sesuai dengan filter pencarian."
                        : "Tidak ada pemain yang dibanned. Server memiliki reputasi bersih."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBans.map((ban) => (
                    <TableRow key={ban.uuid || ban.username}>
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
                        <span className="text-xs font-mono text-subtle-foreground">
                          {ban.bannedAt}
                        </span>
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
                          disabled={isSubmitting}
                          className="text-xs h-7 px-2.5"
                        >
                          Unban
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
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
              placeholder="IP Address or CIDR (e.g. 192.168.1.10)..."
              disabled={isSubmitting}
              className="w-full sm:w-64 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground font-mono focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <input
              type="text"
              value={newIpReason}
              onChange={(e) => setNewIpReason(e.target.value)}
              placeholder="Reason for firewall block..."
              disabled={isSubmitting}
              className="flex-1 bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-danger focus:border-danger"
            />
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isSubmitting || !newIp.trim()}
              className="h-8 px-4 text-xs font-medium"
            >
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
                {filteredIpBans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-xs text-muted-foreground"
                    >
                      {searchQuery
                        ? "Tidak ada IP address yang sesuai dengan filter pencarian."
                        : "Tidak ada alamat IP yang diblokir dalam firewall server."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIpBans.map((ipEntry) => (
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
                        <span className="text-xs font-mono text-subtle-foreground">
                          {ipEntry.bannedAt}
                        </span>
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
                          disabled={isSubmitting}
                          className="text-xs h-7 px-2.5"
                        >
                          Unblock
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
