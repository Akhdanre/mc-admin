"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar, type AdminTab } from "@/components/Sidebar";
import { DashboardOverview } from "@/components/DashboardOverview";
import { UserManagement } from "@/components/UserManagement";
import { WorldControls } from "@/components/WorldControls";
import { LiveMap } from "@/components/LiveMap";
import { ConsoleView } from "@/components/ConsoleView";
import type {
  PlayerStatus,
  PlayerLocation,
  WhitelistStatus,
  WhitelistAction,
  ServerInfoResponse,
  PlayerHistoryResponse,
} from "@/types";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    onlineCount: 0,
    maxCount: 0,
    players: [],
    raw: "",
    updatedAt: "-",
  });

  const [playerLocations, setPlayerLocations] = useState<Record<string, PlayerLocation>>({});
  const [playerHistory, setPlayerHistory] = useState<PlayerHistoryResponse | null>(null);

  const [whitelistStatus, setWhitelistStatus] = useState<WhitelistStatus>({
    players: [],
    raw: "",
    updatedAt: "-",
  });

  const [serverInfo, setServerInfo] = useState<ServerInfoResponse>({
    host: "-",
    port: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const showFeedback = (message: string, isError = false) => {
    setFeedback({ message, isError });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 5000);
  };

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, whitelistRes, locationsRes, historyRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/whitelist"),
        fetch("/api/players/locations"),
        fetch("/api/players/history"),
      ]);

      const statusData = (await statusRes.json()) as PlayerStatus;
      const whitelistData = (await whitelistRes.json()) as WhitelistStatus;
      const locationsData = (await locationsRes.json()) as { locations?: PlayerLocation[] };
      const historyData = (await historyRes.json()) as PlayerHistoryResponse;

      setPlayerStatus(statusData);
      setWhitelistStatus(whitelistData);

      if (locationsData.locations) {
        const locMap: Record<string, PlayerLocation> = {};
        for (const loc of locationsData.locations) {
          locMap[loc.username] = loc;
        }
        setPlayerLocations(locMap);
      }
      setPlayerHistory(historyData);
    } catch (err: unknown) {
      console.error("Failed to sync server status:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/info")
      .then((res) => res.json())
      .then((data: ServerInfoResponse) => setServerInfo(data))
      .catch((err) => console.error(err));

    fetchStatus();
    const timer = setInterval(fetchStatus, 4000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleWhitelistAction = async (action: WhitelistAction, username?: string) => {
    setIsBusy(true);
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username }),
      });
      const data = (await res.json()) as {
        result?: string;
        error?: string;
        status?: WhitelistStatus;
      };

      if (data.error) {
        showFeedback(`Error: ${data.error}`, true);
      } else {
        const defaultMsg =
          action === "add"
            ? `Added ${username} to whitelist`
            : action === "remove"
              ? `Removed ${username} from whitelist`
              : `Whitelist ${action} executed`;
        showFeedback(data.result || defaultMsg);

        if (data.status) {
          setWhitelistStatus(data.status);
        } else {
          await fetchStatus();
        }
      }
    } catch (err: unknown) {
      showFeedback(`Error: ${err instanceof Error ? err.message : String(err)}`, true);
    } finally {
      setIsBusy(false);
    }
  };

  const handleTeleport = async (player: string, target?: string, x?: number, y?: number, z?: number) => {
    setIsBusy(true);
    try {
      const res = await fetch("/api/players/teleport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player, target, x, y, z }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      if (data.error) {
        showFeedback(`Teleport Error: ${data.error}`, true);
      } else {
        showFeedback(data.result || `Teleported ${player}`);
        await fetchStatus();
      }
    } catch (err: unknown) {
      showFeedback(`Teleport failed: ${err instanceof Error ? err.message : String(err)}`, true);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExecuteCommand = async (command: string): Promise<string> => {
    setIsBusy(true);
    try {
      const res = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      });
      const data = (await res.json()) as { result?: string; error?: string };
      await fetchStatus();

      if (data.error) {
        showFeedback(`Command Error: ${data.error}`, true);
        throw new Error(data.error);
      }

      const output = data.result || "Command executed.";
      showFeedback(output);
      return output;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showFeedback(`Command failed: ${errorMsg}`, true);
      throw err;
    } finally {
      setIsBusy(false);
    }
  };

  const isConnected = !playerStatus.error;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onlineCount={playerStatus.onlineCount}
        whitelistCount={whitelistStatus.players.length}
        isConnected={isConnected}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-slate-500">
                Active View:
              </span>
              <span className="text-sm font-bold text-white capitalize">
                {currentTab === "commands"
                  ? "RCON Console"
                  : currentTab === "world"
                  ? "World Controls"
                  : currentTab === "map"
                  ? "Live Web Map"
                  : currentTab}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-300">
              <span className="text-slate-500">Host:</span>
              <span>{serverInfo.host || "Connecting..."}</span>
              <span className="text-slate-600">:</span>
              <span>{serverInfo.port || 25575}</span>
            </div>

            <button
              onClick={fetchStatus}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-white bg-slate-950/80 border border-slate-800 rounded-lg hover:border-slate-700 transition cursor-pointer"
              title="Refresh status"
            >
              <svg
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {/* Notification Feedback Toast */}
          {feedback && (
            <div
              className={`mb-6 p-3.5 rounded-xl text-xs font-mono border shadow-lg flex items-center justify-between ${
                feedback.isError
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{feedback.isError ? "⚠️" : "✓"}</span>
                <span>{feedback.message}</span>
              </div>
              <button
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-white text-sm px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Tab Views */}
          {currentTab === "dashboard" && (
            <DashboardOverview
              playerStatus={playerStatus}
              whitelistStatus={whitelistStatus}
              serverInfo={serverInfo}
              playerHistory={playerHistory}
              onRefresh={fetchStatus}
              isRefreshing={isRefreshing}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === "users" && (
            <UserManagement
              onlinePlayers={playerStatus.players}
              playerLocations={playerLocations}
              whitelistedPlayers={whitelistStatus.players}
              whitelistError={whitelistStatus.error}
              playerHistory={playerHistory}
              onWhitelistAction={handleWhitelistAction}
              onExecuteCommand={handleExecuteCommand}
              onTeleport={handleTeleport}
              isBusy={isBusy}
            />
          )}

          {currentTab === "world" && (
            <WorldControls onExecuteCommand={handleExecuteCommand} isBusy={isBusy} />
          )}

          {currentTab === "map" && (
            <LiveMap mapUrl={process.env.NEXT_PUBLIC_MAP_URL || "http://192.168.137.194:8123"} />
          )}

          {currentTab === "commands" && (
            <ConsoleView onExecuteCommand={handleExecuteCommand} isBusy={isBusy} />
          )}
        </main>
      </div>
    </div>
  );
}
