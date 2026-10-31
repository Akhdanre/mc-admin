"use client";

import { useState } from "react";
import { Sidebar, type AdminTab } from "@/components/layout/Sidebar";
import { DashboardOverview } from "@/components/features/dashboard/DashboardOverview";
import { OnlinePlayersView } from "@/components/features/users/OnlinePlayersView";
import { AccessControlView } from "@/components/features/users/AccessControlView";
import { TelemetryView } from "@/components/features/telemetry/TelemetryView";
import { WorldControls } from "@/components/features/world/WorldControls";
import { LiveMap } from "@/components/features/world/LiveMap";
import { ConsoleView } from "@/components/features/console/ConsoleView";
import { BackupPage } from "@/components/features/backup/BackupPage";
import { SettingsPage } from "@/components/features/settings/SettingsPage";
import { ChatPage } from "@/components/features/chat/ChatPage";
import { ModManager } from "@/components/features/mods/ModManager";
import { useServerStatus } from "@/hooks/useServerStatus";
import { useServerActions } from "@/hooks/useServerActions";
import { useFeedback } from "@/hooks/useFeedback";

const TAB_LABELS: Record<AdminTab, string> = {
  dashboard: "Dashboard",
  commands: "Console & Logs",
  chat: "Live Chat",
  users: "Online Players",
  whitelist: "Access Control",
  map: "Live World Map",
  world: "World & Environment",
  mods: "Mods & Addons",
  backups: "Backups & Restore",
  telemetry: "Host Telemetry",
  settings: "Settings & Configuration",
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
    handleRestoreBackup,
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
        serverVersion="Paper 1.21.4"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header Bar */}
        <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-border bg-surface/95 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-11 h-11 -ml-2 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised cursor-pointer transition-colors"
              aria-label="Open navigation menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-heading">Pulse MC</span>
          </div>

          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="w-11 h-11 -mr-2 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised transition cursor-pointer"
            title="Refresh status"
            aria-label="Refresh status"
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

        {/* Dynamic Main Body Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full min-w-0">
          <div className="max-w-[1160px] mx-auto w-full">
          {feedback && (
            <div
              className={`mb-6 p-3.5 rounded-xl text-xs font-mono border shadow-lg flex items-center justify-between ${
                feedback.isError
                  ? "bg-danger-surface border-danger-border text-danger-muted"
                  : "bg-success-surface border-success-border text-success-muted"
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
              backupStatus={backupStatus}
              playerLocations={playerLocations}
              playerHistory={playerHistory}
              onRefresh={refresh}
              isRefreshing={isRefreshing}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onExecuteCommand={handleExecuteCommand}
            />
          )}
          {currentTab === "users" && (
            <OnlinePlayersView
              livePlayers={playerStatus.players}
              onRefresh={refresh}
              isRefreshing={isRefreshing}
            />
          )}

          {currentTab === "whitelist" && (
            <AccessControlView onWhitelistAction={handleWhitelistAction} />
          )}

          {currentTab === "telemetry" && (
            <TelemetryView onRefresh={refresh} isRefreshing={isRefreshing} />
          )}

          {currentTab === "world" && (
            <WorldControls
              onExecuteCommand={handleExecuteCommand}
              isBusy={isBusy}
              currentDifficulty={playerStatus.difficulty}
              onRefreshStatus={refresh}
              onShowFeedback={showFeedback}
            />
          )}
          {currentTab === "mods" && (
            <ModManager onShowFeedback={showFeedback} />
          )}


          {currentTab === "backups" && (
            <BackupPage
              backupStatus={backupStatus}
              onRefresh={refresh}
              onTriggerBackup={handleTriggerBackup}
              onDeleteBackup={handleDeleteBackup}
              onSetRetention={handleSetRetention}
              onRestoreBackup={handleRestoreBackup}
              isBackingUp={isBackingUp}
              isBusy={isBusy}
            />
          )}

          {currentTab === "map" && (
            <LiveMap mapUrl={serverInfo.mapUrl || "http://localhost:8123"} />
          )}

          {currentTab === "commands" && (
            <ConsoleView onExecuteCommand={handleExecuteCommand} isBusy={isBusy} />
          )}

          {currentTab === "chat" && <ChatPage />}

          {currentTab === "settings" && (
            <SettingsPage
              backupStatus={backupStatus}
              onUpdateRetention={handleSetRetention}
              isBusy={isBusy}
            />
          )}
          </div>
        </main>
      </div>
    </div>
  );
}
