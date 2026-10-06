import { exec } from "child_process";
import { promisify } from "util";
import { config } from "@/config";
import type {
  BackupStatusResponse,
  BackupTriggerResponse,
  BackupDeleteResponse,
  BackupRetentionResponse,
} from "@/types";

const execAsync = promisify(exec);

const REMOTE_SCRIPT = "/home/oukendev/scripts/backup_manager.py";

function sshCommand(remoteArgs: string): string {
  return `ssh -o BatchMode=yes -o ConnectTimeout=5 ${config.ssh.host} "python3 ${REMOTE_SCRIPT} ${remoteArgs}"`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export async function getBackupStatus(): Promise<BackupStatusResponse> {
  const updatedAt = new Date().toLocaleTimeString();

  try {
    const { stdout } = await execAsync(sshCommand(""), { timeout: 10000 });
    const parsed = JSON.parse(stdout.trim());

    return {
      backups: parsed.backups || [],
      totalCount: parsed.totalCount || 0,
      totalSizeBytes: parsed.totalSizeBytes || 0,
      totalSizeFormatted: parsed.totalSizeFormatted || "0 MB",
      retentionDays: parsed.retentionDays || 7,
      latestBackup: parsed.latestBackup || null,
      updatedAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      backups: [],
      totalCount: 0,
      totalSizeBytes: 0,
      totalSizeFormatted: "0 MB",
      retentionDays: 7,
      latestBackup: null,
      error: message,
      updatedAt,
    };
  }
}

export async function triggerBackup(): Promise<BackupTriggerResponse> {
  const triggeredAt = new Date().toLocaleTimeString();

  try {
    const { stdout } = await execAsync(sshCommand("trigger"), { timeout: 180000 });
    const parsed = JSON.parse(stdout.trim());

    return {
      success: Boolean(parsed.success),
      output: parsed.output || "",
      triggeredAt,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
      triggeredAt,
    };
  }
}

export async function deleteBackup(filename: string): Promise<BackupDeleteResponse> {
  try {
    const { stdout } = await execAsync(sshCommand(`delete ${shellQuote(filename)}`), { timeout: 15000 });
    const parsed = JSON.parse(stdout.trim());

    return {
      success: Boolean(parsed.success),
      deleted: parsed.deleted,
      error: parsed.error,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

export async function setRetention(days: number): Promise<BackupRetentionResponse> {
  try {
    const { stdout } = await execAsync(sshCommand(`retention ${Math.trunc(days)}`), { timeout: 15000 });
    const parsed = JSON.parse(stdout.trim());

    return {
      success: Boolean(parsed.success),
      retentionDays: parsed.retentionDays,
      error: parsed.error,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}
