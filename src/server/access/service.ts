import "server-only";
import fs from "fs";
import path from "path";
import { config, BadRequestError } from "@/server/core";
import { executeRconCommand } from "@/server/rcon";
import type {
  AccessControlData,
  AccessControlRequestBody,
  BanEntry,
  IpBanEntry,
  WhitelistEntry,
} from "@/types";

interface RawWhitelistItem {
  uuid?: string;
  name?: string;
}

interface RawOpItem {
  uuid?: string;
  name?: string;
  level?: number;
  bypassesPlayerLimit?: boolean;
}

interface RawBanItem {
  uuid?: string;
  name?: string;
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
}

interface RawIpBanItem {
  ip?: string;
  created?: string;
  source?: string;
  expires?: string;
  reason?: string;
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function getAccessControlData(): Promise<AccessControlData> {
  const dataDir = config.paths.data;
  const updatedAt = new Date().toLocaleTimeString();

  const whitelistPath = path.join(dataDir, "whitelist.json");
  const opsPath = path.join(dataDir, "ops.json");
  const bannedPlayersPath = path.join(dataDir, "banned-players.json");
  const bannedIpsPath = path.join(dataDir, "banned-ips.json");
  const serverPropsPath = path.join(dataDir, "server.properties");

  const rawWhitelist = safeReadJson<RawWhitelistItem[]>(whitelistPath) ?? [];
  const rawOps = safeReadJson<RawOpItem[]>(opsPath) ?? [];
  const rawBans = safeReadJson<RawBanItem[]>(bannedPlayersPath) ?? [];
  const rawIpBans = safeReadJson<RawIpBanItem[]>(bannedIpsPath) ?? [];

  let whitelistEnforced = true;
  try {
    if (fs.existsSync(serverPropsPath)) {
      const props = fs.readFileSync(serverPropsPath, "utf-8");
      whitelistEnforced = !props.includes("white-list=false");
    }
  } catch {
    whitelistEnforced = true;
  }

  let fileDate = "Recorded";
  try {
    if (fs.existsSync(whitelistPath)) {
      const stat = fs.statSync(whitelistPath);
      fileDate = stat.mtime.toISOString().slice(0, 10);
    }
  } catch {
    fileDate = "Recorded";
  }

  const opUuids = new Set(rawOps.map((op) => op.uuid?.toLowerCase()).filter(Boolean));
  const opNames = new Set(rawOps.map((op) => op.name?.toLowerCase()).filter(Boolean));

  const whitelist: WhitelistEntry[] = rawWhitelist
    .filter((w) => Boolean(w.name))
    .map((w) => {
      const username = w.name ?? "Unknown";
      const uuid = w.uuid ?? "";
      const isOp =
        (Boolean(uuid) && opUuids.has(uuid.toLowerCase())) || opNames.has(username.toLowerCase());
      return {
        uuid,
        username,
        addedAt: fileDate,
        addedBy: isOp ? "Operator" : "Console",
        isOp,
      };
    });

  const bans: BanEntry[] = rawBans
    .filter((b) => Boolean(b.name))
    .map((b) => ({
      uuid: b.uuid ?? "",
      username: b.name ?? "Unknown",
      reason: b.reason || "Banned by an operator.",
      bannedBy: b.source || "Console",
      bannedAt: b.created ? b.created.slice(0, 16).replace("T", " ") : "Unknown",
      expires: !b.expires || b.expires === "forever" ? "Permanent" : b.expires,
    }));

  const ipBans: IpBanEntry[] = rawIpBans
    .filter((ib) => Boolean(ib.ip))
    .map((ib) => ({
      ip: ib.ip ?? "",
      reason: ib.reason || "Suspicious network traffic",
      bannedBy: ib.source || "Console",
      bannedAt: ib.created ? ib.created.slice(0, 10) : "Unknown",
      expires: !ib.expires || ib.expires === "forever" ? "Permanent" : ib.expires,
      country: "Global",
    }));

  return {
    whitelist,
    whitelistEnforced,
    bans,
    ipBans,
    updatedAt,
  };
}

export async function executeAccessAction(
  body: AccessControlRequestBody
): Promise<{ result: string; data: AccessControlData }> {
  const { action, username, reason, ip } = body;

  let command = "";
  switch (action) {
    case "add": {
      if (!username) throw new BadRequestError("Username required for whitelist add");
      command = `whitelist add ${username}`;
      break;
    }
    case "remove": {
      if (!username) throw new BadRequestError("Username required for whitelist remove");
      command = `whitelist remove ${username}`;
      break;
    }
    case "on": {
      command = "whitelist on";
      break;
    }
    case "off": {
      command = "whitelist off";
      break;
    }
    case "reload": {
      command = "whitelist reload";
      break;
    }
    case "ban": {
      if (!username) throw new BadRequestError("Username required for ban");
      const cleanReason = (reason ?? "Banned via Access Control").trim().replace(/[\r\n]+/g, " ");
      command = `ban ${username} ${cleanReason}`;
      break;
    }
    case "unban": {
      if (!username) throw new BadRequestError("Username required for unban");
      command = `pardon ${username}`;
      break;
    }
    case "ban-ip": {
      if (!ip) throw new BadRequestError("IP address required for ban-ip");
      const cleanReason = (reason ?? "Suspicious network traffic").trim().replace(/[\r\n]+/g, " ");
      command = `ban-ip ${ip} ${cleanReason}`;
      break;
    }
    case "unban-ip": {
      if (!ip) throw new BadRequestError("IP address required for unban-ip");
      command = `pardon-ip ${ip}`;
      break;
    }
    case "op": {
      if (!username) throw new BadRequestError("Username required for op");
      command = `op ${username}`;
      break;
    }
    case "deop": {
      if (!username) throw new BadRequestError("Username required for deop");
      command = `deop ${username}`;
      break;
    }
    default: {
      throw new BadRequestError(`Unknown access action: ${action}`);
    }
  }

  const result = await executeRconCommand(command);

  // Return fresh data after mutation
  const data = await getAccessControlData();
  return { result, data };
}
