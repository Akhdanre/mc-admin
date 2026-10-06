export interface PlayerStatus {
  onlineCount: number;
  maxCount: number;
  players: string[];
  raw: string;
  error?: string;
  updatedAt: string;
}

export interface PlayerHistory {
  username: string;
  uuid?: string | null;
  lastSeen?: string | null;
  lastSeenTimestamp?: number | null;
  lastLogin?: string | null;
  lastLoginTimestamp?: number | null;
  online: boolean;
}

export interface PlayerHistoryResponse {
  players: PlayerHistory[];
  lastLoginPlayer?: PlayerHistory | null;
  error?: string;
  updatedAt: string;
}

export interface BackupItem {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  mtime: number;
  createdAt: string;
  isLatest: boolean;
}

export interface BackupStatusResponse {
  backups: BackupItem[];
  totalCount: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  retentionDays: number;
  latestBackup: BackupItem | null;
  error?: string;
  updatedAt: string;
}

export interface BackupTriggerResponse {
  success: boolean;
  output?: string;
  error?: string;
  triggeredAt: string;
}

export interface BackupDeleteResponse {
  success: boolean;
  deleted?: string;
  error?: string;
}

export interface BackupRetentionResponse {
  success: boolean;
  retentionDays?: number;
  error?: string;
}

export interface WhitelistStatus {
  players: string[];
  raw: string;
  error?: string;
  updatedAt: string;
}

export type WhitelistAction = "add" | "remove" | "reload" | "on" | "off";

export interface WhitelistRequestBody {
  action?: WhitelistAction;
  username?: string;
}

export interface CommandRequestBody {
  command?: string;
}

export interface ServerInfoResponse {
  host: string;
  port: number;
}

export interface PlayerLocation {
  username: string;
  x: number;
  y: number;
  z: number;
  dimension: string;
}

export interface TeleportRequestBody {
  player: string;
  target?: string;
  x?: number;
  y?: number;
  z?: number;
}
