"use client";

import { useState } from "react";
import { Sidebar, type AdminTab } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { DashboardOverview } from "@/components/features/dashboard/DashboardOverview";
import { UserManagement } from "@/components/features/users/UserManagement";
import { WorldControls } from "@/components/features/world/WorldControls";
import { LiveMap } from "@/components/features/world/LiveMap";
import { ConsoleView } from "@/components/features/console/ConsoleView";
import { BackupPage } from "@/components/features/backup/BackupPage";
import { SettingsPage } from "@/components/features/settings/SettingsPage";
import { useServerStatus } from "@/hooks/useServerStatus";
import { useServerActions } from "@/hooks/useServerActions";
import { useFeedback } from "@/hooks/useFeedback";

const TAB_LABELS: Record<AdminTab, string> = {
  dashboard: "dashboard",
  users: "users",
  world: "World Controls",
  backups: "Backup Management",
  map: "Live Web Map",
  commands: "RCON Console",
  settings: "Settings",
};

export default function Home() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { feedback, showFeedback, clearFeedback } = useFeedback();
  const {
    playerStatus,
    playerLocations,
    playerHistory,
    backupStatus,
    whitelistStatus,
    serverInfo,
    isRefreshing,
    refresh,
    setWhitelistStatus,
  } = useServerStatus();
  const {
    isBusy,
    isBackingUp,
    handleWhitelistAction,
    handleTeleport,
    handleExecuteCommand,
    handleTriggerBackup,
    handleDeleteBackup,
    handleSetRetention,
  } = useServerActions({ showFeedback, refresh, setWhitelistStatus });

  const isConnected = !playerStatus.error;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onlineCount={playerStatus.onlineCount}
        whitelistCount={whitelistStatus.players.length}
        backupCount={backupStatus?.totalCount ?? 0}
        isConnected={isConnected}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 px-6 border-b border-border bg-surface/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-surface-raised cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono font-semibold tracking-wider text-slate-500">
                Active View:
              </span>
              <span className="text-sm font-bold text-heading capitalize">{TAB_LABELS[currentTab]}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1 bg-overlay/80 border border-border rounded-lg text-foreground">
              <span className="text-slate-500">Host:</span>
              <span>{serverInfo.host || "Connecting..."}</span>
              <span className="text-slate-600">:</span>
              <span>{serverInfo.port || 25575}</span>
            </div>

            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="p-2 text-muted-foreground hover:text-foreground bg-overlay/80 border border-border rounded-lg hover:border-border-strong transition cursor-pointer"
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

            <ThemeToggle />
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
                onClick={clearFeedback}
                className="text-slate-400 hover:text-foreground text-sm px-1 cursor-pointer"
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
              onRefresh={refresh}
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

          {currentTab === "backups" && (
            <BackupPage
              backupStatus={backupStatus}
              onRefresh={refresh}
              onTriggerBackup={handleTriggerBackup}
              onDeleteBackup={handleDeleteBackup}
              onSetRetention={handleSetRetention}
              isBackingUp={isBackingUp}
              isBusy={isBusy}
            />
          )}

          {currentTab === "map" && (
            <LiveMap mapUrl={process.env.NEXT_PUBLIC_MAP_URL || "http://192.168.137.194:8123"} />
          )}

          {currentTab === "commands" && (
            <ConsoleView onExecuteCommand={handleExecuteCommand} isBusy={isBusy} />
          )}

          {currentTab === "settings" && (
            <SettingsPage
              backupStatus={backupStatus}
              onUpdateRetention={handleSetRetention}
              isBusy={isBusy}
            />
          )}
        </main>
      </div>
    </div>
  );
}
