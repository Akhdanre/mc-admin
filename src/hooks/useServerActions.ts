"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import type { WhitelistAction, WhitelistStatus } from "@/types";

type ShowFeedback = (message: string, isError?: boolean) => void;
type Refresh = () => Promise<void>;
type SetWhitelist = (status: WhitelistStatus) => void;

interface ActionDeps {
  showFeedback: ShowFeedback;
  refresh: Refresh;
  setWhitelistStatus: SetWhitelist;
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Server mutation actions (whitelist, teleport, RCON command, backups).
 * Each handler manages its own busy/backing-up flag and surfaces feedback,
 * mirroring the behavior previously inlined in the page component.
 */
export function useServerActions({ showFeedback, refresh, setWhitelistStatus }: ActionDeps) {
  const [isBusy, setIsBusy] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleWhitelistAction = async (action: WhitelistAction, username?: string) => {
    setIsBusy(true);
    try {
      const data = await apiPost<{ result?: string; error?: string; status?: WhitelistStatus }>(
        "/api/whitelist",
        { action, username }
      );

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
          await refresh();
        }
      }
    } catch (err: unknown) {
      showFeedback(`Error: ${errMsg(err)}`, true);
    } finally {
      setIsBusy(false);
    }
  };

  const handleTeleport = async (
    player: string,
    target?: string,
    x?: number,
    y?: number,
    z?: number
  ) => {
    setIsBusy(true);
    try {
      const data = await apiPost<{ result?: string; error?: string }>(
        "/api/players/teleport",
        { player, target, x, y, z }
      );
      if (data.error) {
        showFeedback(`Teleport Error: ${data.error}`, true);
      } else {
        showFeedback(data.result || `Teleported ${player}`);
        await refresh();
      }
    } catch (err: unknown) {
      showFeedback(`Teleport failed: ${errMsg(err)}`, true);
    } finally {
      setIsBusy(false);
    }
  };

  const handleExecuteCommand = async (command: string): Promise<string> => {
    setIsBusy(true);
    try {
      const data = await apiPost<{ result?: string; error?: string }>("/api/command", { command });
      await refresh();

      if (data.error) {
        showFeedback(`Command Error: ${data.error}`, true);
        throw new Error(data.error);
      }

      const output = data.result || "Command executed.";
      showFeedback(output);
      return output;
    } catch (err: unknown) {
      const errorMsg = errMsg(err);
      showFeedback(`Command failed: ${errorMsg}`, true);
      throw err;
    } finally {
      setIsBusy(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    showFeedback("Backup started. This may take a moment...");
    try {
      const data = await apiPost<{ success?: boolean; output?: string; error?: string }>(
        "/api/backup"
      );

      if (data.success) {
        showFeedback("Backup completed successfully.");
      } else {
        showFeedback(`Backup failed: ${data.error || data.output || "Unknown error"}`, true);
      }
      await refresh();
    } catch (err: unknown) {
      showFeedback(`Backup failed: ${errMsg(err)}`, true);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    setIsBackingUp(true);
    try {
      const data = await apiPost<{ success?: boolean; error?: string }>("/api/backup", {
        action: "delete",
        filename,
      });

      if (data.success) {
        showFeedback(`Deleted backup ${filename}`);
      } else {
        showFeedback(`Delete failed: ${data.error || "Unknown error"}`, true);
      }
      await refresh();
    } catch (err: unknown) {
      showFeedback(`Delete failed: ${errMsg(err)}`, true);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    setIsBackingUp(true);
    try {
      const data = await apiPost<{ success?: boolean; error?: string }>("/api/backup", {
        action: "restore",
        filename,
      });

      if (data.success) {
        showFeedback(`Successfully rolled back to ${filename}. Server restart recommended.`);
      } else {
        showFeedback(`Rollback failed: ${data.error || "Unknown error"}`, true);
      }
      await refresh();
    } catch (err: unknown) {
      showFeedback(`Rollback failed: ${errMsg(err)}`, true);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleSetRetention = async (days: number) => {
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      showFeedback("Retention must be between 1 and 365 days", true);
      return;
    }
    setIsBusy(true);
    try {
      const data = await apiPost<{ success?: boolean; retentionDays?: number; error?: string }>(
        "/api/backup",
        { action: "retention", retentionDays: days }
      );

      if (data.success) {
        showFeedback(`Retention policy set to ${data.retentionDays} days`);
      } else {
        showFeedback(`Failed to update retention: ${data.error || "Unknown error"}`, true);
      }
      await refresh();
    } catch (err: unknown) {
      showFeedback(`Failed to update retention: ${errMsg(err)}`, true);
    } finally {
      setIsBusy(false);
    }
  };

  return {
    isBusy,
    isBackingUp,
    handleWhitelistAction,
    handleTeleport,
    handleExecuteCommand,
    handleTriggerBackup,
    handleDeleteBackup,
    handleSetRetention,
    handleRestoreBackup,
  };
}
