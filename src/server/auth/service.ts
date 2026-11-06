import "server-only";
import crypto from "crypto";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import { config } from "@/server/core";
import {
  SESSION_COOKIE_NAME,
  createSessionToken as buildSessionToken,
  verifySessionToken as checkSessionToken,
  hashPassword,
  verifyPasswordHash,
} from "./token";

export { SESSION_COOKIE_NAME };

const AUTH_FILE = "admin_auth.json";
const SESSION_SECRET_FILE = "session_secret";

interface AuthStore {
  hash: string;
  salt: string;
}

let sessionSecretCache: string | null = null;

function getSecretFilePath(): string {
  const primary = path.join(config.paths.data, SESSION_SECRET_FILE);
  try {
    if (fsSync.existsSync(primary)) return primary;
    fsSync.mkdirSync(path.dirname(primary), { recursive: true });
    return primary;
  } catch {
    return path.join(os.tmpdir(), "mc_dashboard_session_secret");
  }
}

function getSessionSecret(): string {
  if (sessionSecretCache) {
    return sessionSecretCache;
  }
  if (process.env.SESSION_SECRET) {
    sessionSecretCache = process.env.SESSION_SECRET;
    return sessionSecretCache;
  }

  const filePath = getSecretFilePath();
  try {
    if (fsSync.existsSync(filePath)) {
      sessionSecretCache = fsSync.readFileSync(filePath, "utf-8").trim();
      if (sessionSecretCache) return sessionSecretCache;
    }
    sessionSecretCache = crypto.randomBytes(32).toString("hex");
    fsSync.writeFileSync(filePath, sessionSecretCache, "utf-8");
  } catch {
    sessionSecretCache = crypto.randomBytes(32).toString("hex");
  }
  return sessionSecretCache;
}

function rotateSessionSecret(): void {
  sessionSecretCache = crypto.randomBytes(32).toString("hex");
  const filePath = getSecretFilePath();
  try {
    fsSync.writeFileSync(filePath, sessionSecretCache, "utf-8");
  } catch {
    // Keep in-memory cache
  }
}

let inMemoryCredentials: AuthStore | null = null;

async function getStoredCredentials(): Promise<AuthStore | null> {
  if (inMemoryCredentials) {
    return inMemoryCredentials;
  }
  try {
    const authPath = path.join(config.paths.data, AUTH_FILE);
    const raw = await fs.readFile(authPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.hash && parsed.salt) {
      inMemoryCredentials = parsed as AuthStore;
      return inMemoryCredentials;
    }
    return null;
  } catch {
    return inMemoryCredentials;
  }
}

async function saveCredentials(hash: string, salt: string): Promise<void> {
  inMemoryCredentials = { hash, salt };
  try {
    const authPath = path.join(config.paths.data, AUTH_FILE);
    await fs.mkdir(path.dirname(authPath), { recursive: true });
    await fs.writeFile(authPath, JSON.stringify(inMemoryCredentials, null, 2), "utf-8");
  } catch {
    // Keep in-memory if disk is not writable
  }
}
async function getOrInitCredentials(): Promise<AuthStore> {
  const existing = await getStoredCredentials();
  if (existing) {
    return existing;
  }

  // Initial password from env or default admin123
  const initialPassword = process.env.ADMIN_PASSWORD || "admin123";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await hashPassword(initialPassword, salt);
  try {
    await saveCredentials(hash, salt);
  } catch {
    // If /data isn't writable yet, continue with in-memory hash
  }
  return { hash, salt };
}

export async function verifyPassword(password: string): Promise<boolean> {
  try {
    const creds = await getOrInitCredentials();
    return await verifyPasswordHash(password, creds.salt, creds.hash);
  } catch {
    return false;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters" };
  }

  const isValid = await verifyPassword(currentPassword);
  if (!isValid) {
    return { success: false, error: "Incorrect current password" };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await hashPassword(newPassword, salt);
  try {
    await saveCredentials(hash, salt);
    rotateSessionSecret();
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to persist new password",
    };
  }
}

export function createSessionToken(): string {
  return buildSessionToken(getSessionSecret());
}

export function verifySessionToken(token: string | undefined): boolean {
  return checkSessionToken(token, getSessionSecret());
}
