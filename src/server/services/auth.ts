import "server-only";
import crypto from "crypto";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { config } from "@/server/config";

export const SESSION_COOKIE_NAME = "mc_admin_session";
const AUTH_FILE = "admin_auth.json";
const SESSION_SECRET_FILE = "session_secret";

interface AuthStore {
  hash: string;
  salt: string;
}

let sessionSecretCache: string | null = null;

function getSessionSecret(): string {
  if (sessionSecretCache) {
    return sessionSecretCache;
  }
  if (process.env.SESSION_SECRET) {
    sessionSecretCache = process.env.SESSION_SECRET;
    return sessionSecretCache;
  }

  const secretPath = path.join(config.paths.data, SESSION_SECRET_FILE);
  try {
    if (fsSync.existsSync(secretPath)) {
      sessionSecretCache = fsSync.readFileSync(secretPath, "utf-8").trim();
      if (sessionSecretCache) return sessionSecretCache;
    }
    sessionSecretCache = crypto.randomBytes(32).toString("hex");
    fsSync.writeFileSync(secretPath, sessionSecretCache, "utf-8");
  } catch {
    sessionSecretCache = crypto.randomBytes(32).toString("hex");
  }
  return sessionSecretCache;
}

function hashPassword(password: string, salt: string): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  crypto.scrypt(password, salt, 64, (err, derivedKey) => {
    if (err) reject(err);
    else resolve(derivedKey.toString("hex"));
  });
  return promise;
}

async function getAuthStorePath(): Promise<string> {
  return path.join(config.paths.data, AUTH_FILE);
}

async function getStoredCredentials(): Promise<AuthStore | null> {
  try {
    const authPath = await getAuthStorePath();
    const raw = await fs.readFile(authPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed.hash && parsed.salt) {
      return parsed as AuthStore;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveCredentials(hash: string, salt: string): Promise<void> {
  const authPath = await getAuthStorePath();
  const data: AuthStore = { hash, salt };
  await fs.writeFile(authPath, JSON.stringify(data, null, 2), "utf-8");
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
    const testHash = await hashPassword(password, creds.salt);
    const bufA = Buffer.from(creds.hash, "hex");
    const bufB = Buffer.from(testHash, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
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
    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to persist new password",
    };
  }
}

export function createSessionToken(): string {
  const secret = getSessionSecret();
  const payload = {
    user: "admin",
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(dataStr).digest("base64url");
  return `${dataStr}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !token.includes(".")) return false;
  const [dataStr, signature] = token.split(".");
  if (!dataStr || !signature) return false;

  const secret = getSessionSecret();
  const expectedSignature = crypto.createHmac("sha256", secret).update(dataStr).digest("base64url");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const payload = JSON.parse(Buffer.from(dataStr, "base64url").toString("utf-8"));
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
