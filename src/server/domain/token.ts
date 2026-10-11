import crypto from "crypto";

/**
 * Pure session-token and password-hash helpers. No I/O — secret material is
 * supplied by the caller (data layer), which keeps this module trivially
 * unit-testable.
 */

export const SESSION_COOKIE_NAME = "mc_admin_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSessionToken(secret: string): string {
  const payload = {
    user: "admin",
    exp: Date.now() + SESSION_TTL_MS,
    nonce: crypto.randomBytes(16).toString("hex"),
  };
  const dataStr = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(dataStr).digest("base64url");
  return `${dataStr}.${signature}`;
}

export function verifySessionToken(token: string | undefined, secret: string): boolean {
  if (!token || !token.includes(".")) return false;
  const [dataStr, signature] = token.split(".");
  if (!dataStr || !signature) return false;

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

export function hashPassword(password: string, salt: string): Promise<string> {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  crypto.scrypt(password, salt, 64, (err, derivedKey) => {
    if (err) reject(err);
    else resolve(derivedKey.toString("hex"));
  });
  return promise;
}

export function verifyPasswordHash(password: string, salt: string, expectedHash: string): Promise<boolean> {
  const testHash = hashPassword(password, salt);
  return testHash.then((hash) => {
    const bufA = Buffer.from(expectedHash, "hex");
    const bufB = Buffer.from(hash, "hex");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  });
}
