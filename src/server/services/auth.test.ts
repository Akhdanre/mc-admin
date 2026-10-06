import { describe, expect, it } from "bun:test";
import { createSessionToken, verifySessionToken } from "./auth";

describe("Auth Session Service", () => {
  it("creates and verifies valid session tokens", () => {
    const token = createSessionToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.includes(".")).toBe(true);

    const isValid = verifySessionToken(token);
    expect(isValid).toBe(true);
  });

  it("rejects undefined or empty tokens", () => {
    expect(verifySessionToken(undefined)).toBe(false);
    expect(verifySessionToken("")).toBe(false);
    expect(verifySessionToken("not-a-token")).toBe(false);
  });

  it("rejects tampered tokens", () => {
    const token = createSessionToken();
    const parts = token.split(".");
    const sig = parts[1];
    // Tamper payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ user: "hacker", exp: Date.now() + 100000 })
    ).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${sig}`;

    expect(verifySessionToken(tamperedToken)).toBe(false);
  });

  it("rejects expired tokens", () => {
    const expiredPayload = Buffer.from(
      JSON.stringify({ user: "admin", exp: Date.now() - 1000 })
    ).toString("base64url");
    const token = `${expiredPayload}.invalidsig`;
    expect(verifySessionToken(token)).toBe(false);
  });
});
