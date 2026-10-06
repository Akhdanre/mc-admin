import { exec } from "child_process";
import { promisify } from "util";
import { config } from "@/config";
import type { BackupStatusResponse, BackupTriggerResponse } from "@/types";

const execAsync = promisify(exec);

export async function getBackupStatus(): Promise<BackupStatusResponse> {
  const updatedAt = new Date().toLocaleTimeString();

  try {
    const remoteCmd = "python3 /home/oukendev/scripts/backup_manager.py";
    const sshTarget = config.ssh.host;
    const command = `ssh -o BatchMode=yes -o ConnectTimeout=5 ${sshTarget} "${remoteCmd}"`;

    const { stdout } = await execAsync(command, { timeout: 10000 });
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
    const remoteCmd = "python3 /home/oukendev/scripts/backup_manager.py trigger";
    const sshTarget = config.ssh.host;
    const command = `ssh -o BatchMode=yes -o ConnectTimeout=5 ${sshTarget} "${remoteCmd}"`;

    const { stdout } = await execAsync(command, { timeout: 180000 });
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
