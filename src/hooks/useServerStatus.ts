"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { usePolling } from "@/hooks/usePolling";
import type {
  PlayerStatus,
  PlayerLocation,
  WhitelistStatus,
  ServerInfoResponse,
  PlayerHistoryResponse,
  BackupStatusResponse,
} from "@/types";

const EMPTY_STATUS: PlayerStatus = {
  onlineCount: 0,
  maxCount: 0,
  players: [],
  raw: "",
  updatedAt: "-",
};

const EMPTY_WHITELIST: WhitelistStatus = { players: [], raw: "", updatedAt: "-" };

export const POLL_INTERVAL_MS = 4000;

/**
 * Aggregates the dashboard's polled server state (players, whitelist,
 * locations, history, backups) plus the one-shot server info lookup.
 * Polls every {@link POLL_INTERVAL_MS}; `refresh` forces an immediate refetch.
 */
export function useServerStatus() {
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(EMPTY_STATUS);
  const [playerLocations, setPlayerLocations] = useState<Record<string, PlayerLocation>>({});
  const [playerHistory, setPlayerHistory] = useState<PlayerHistoryResponse | null>(null);
  const [backupStatus, setBackupStatus] = useState<BackupStatusResponse | null>(null);
  const [whitelistStatus, setWhitelistStatus] = useState<WhitelistStatus>(EMPTY_WHITELIST);
  const [serverInfo, setServerInfo] = useState<ServerInfoResponse>({ host: "-", port: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statusData, whitelistData, locationsData, historyData, backupData] =
        await Promise.all([
          apiGet<PlayerStatus>("/api/status"),
          apiGet<WhitelistStatus>("/api/whitelist"),
          apiGet<{ locations?: PlayerLocation[] }>("/api/players/locations"),
          apiGet<PlayerHistoryResponse>("/api/players/history"),
          apiGet<BackupStatusResponse>("/api/backup"),
        ]);

      setPlayerStatus(statusData);
      setWhitelistStatus(whitelistData);
      setBackupStatus(backupData);

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

  usePolling(refresh, POLL_INTERVAL_MS);

  useEffect(() => {
    apiGet<ServerInfoResponse>("/api/info")
      .then(setServerInfo)
      .catch((err) => console.error(err));
  }, []);

  return {
    playerStatus,
    playerLocations,
    playerHistory,
    backupStatus,
    whitelistStatus,
    serverInfo,
    isRefreshing,
    refresh,
    setWhitelistStatus,
    setBackupStatus,
  };
}
