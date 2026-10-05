export interface PlayerStatus {
  onlineCount: number;
  maxCount: number;
  players: string[];
  raw: string;
  error?: string;
  updatedAt: string;
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
