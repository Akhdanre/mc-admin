export interface PlayerStatus {
  onlineCount: number;
  maxCount: number;
  players: string[];
  difficulty?: string;
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

export interface BackupRestoreResponse {
  success: boolean;
  restored?: string;
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
  mapUrl?: string;
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

export interface AuthSessionResponse {
  authenticated: boolean;
  username?: string;
}

export interface LoginRequestBody {
  password: string;
}

export interface ChangePasswordRequestBody {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  error?: string;
}

export interface AppSettings {
  rconHost: string;
  rconPort: number;
  rconPassword: string;
  rconTimeoutMs: number;
  mapUrl: string;
}

export interface AppSettingsResponse {
  settings: AppSettings;
  error?: string;
}

export interface TestRconResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  isServer: boolean;
}

export interface ChatResponse {
  messages: ChatMessage[];
  error?: string;
  updatedAt: string;
}

export interface SendChatRequestBody {
  message: string;
}

export interface DiscordConfig {
  webhookUrl: string;
  enabled: boolean;
  relayChat: boolean;
  relayEvents: boolean;
  botToken?: string;
  botChannelId?: string;
  relayDiscordToMinecraft?: boolean;
}

export interface DiscordSettingsResponse {
  config: DiscordConfig;
  error?: string;
}

export interface TestDiscordWebhookResponse {
  success: boolean;
  error?: string;
}

export interface ModInfo {
  fileName: string;
  name: string;
  id?: string;
  version?: string;
  description?: string;
  loader?: "fabric" | "forge" | "neoforge" | "quilt" | "unknown";
  sizeBytes: number;
  modifiedAt: string;
  enabled: boolean;
}

export interface ModsListResponse {
  mods: ModInfo[];
  error?: string;
}

export interface ModrinthSearchResult {
  project_id: string;
  title: string;
  description: string;
  author: string;
  icon_url?: string;
  downloads: number;
  loaders: string[];
  versions: string[];
}

export interface ModrinthSearchResponse {
  hits: ModrinthSearchResult[];
  total_hits: number;
  error?: string;
}
