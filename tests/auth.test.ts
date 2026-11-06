import { describe, expect, it } from "bun:test";
import { createSessionToken, verifySessionToken } from "@/server/auth";
import { changePassword } from "@/server/auth";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { POST as loginHandler } from "@/app/api/auth/login/route";
import { SESSION_COOKIE_NAME } from "@/server/auth";

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

  it("invalidates active sessions after password change", async () => {
    const token = createSessionToken();
    expect(verifySessionToken(token)).toBe(true);

    const res = await changePassword("admin123", "newAdminPassword123");
    expect(res.success).toBe(true);

    expect(verifySessionToken(token)).toBe(false);

    // Revert back for other tests
    await changePassword("newAdminPassword123", "admin123");
  });
});

describe("Auth Proxy", () => {
  it("redirects unauthenticated root visit to /login", () => {
    const req = new NextRequest("http://localhost/");
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
  });

  it("redirects expired token on root visit to /login and clears cookie", () => {
    const expiredPayload = Buffer.from(
      JSON.stringify({ user: "admin", exp: Date.now() - 1000 })
    ).toString("base64url");
    const expiredToken = `${expiredPayload}.somesig`;

    const req = new NextRequest("http://localhost/", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${expiredToken}` },
    });
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=;`);
  });

  it("allows expired token to access /login without looping back to root", () => {
    const expiredPayload = Buffer.from(
      JSON.stringify({ user: "admin", exp: Date.now() - 1000 })
    ).toString("base64url");
    const expiredToken = `${expiredPayload}.somesig`;

    const req = new NextRequest("http://localhost/login", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${expiredToken}` },
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("redirects valid token on /login to root", () => {
    const validToken = createSessionToken();
    const req = new NextRequest("http://localhost/login", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${validToken}` },
    });
    const res = proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/");
  });

  it("allows valid token to access root", () => {
    const validToken = createSessionToken();
    const req = new NextRequest("http://localhost/", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${validToken}` },
    });
    const res = proxy(req);
    expect(res.status).toBe(200);
  });

  it("returns 401 for expired token on API route and clears cookie", () => {
    const expiredPayload = Buffer.from(
      JSON.stringify({ user: "admin", exp: Date.now() - 1000 })
    ).toString("base64url");
    const expiredToken = `${expiredPayload}.somesig`;

    const req = new NextRequest("http://localhost/api/status", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${expiredToken}` },
    });
    const res = proxy(req);
    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=;`);
  });

  it("allows /api/auth/logout without active token", () => {
    const req = new NextRequest("http://localhost/api/auth/logout");
    const res = proxy(req);
    expect(res.status).toBe(200);
  });
});

describe("Auth Login API", () => {
  it("rejects invalid username", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "wronguser", password: "admin123" }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.message).toBe("Invalid username or password");
  });

  it("rejects invalid password", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "wrongpassword" }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error.message).toBe("Invalid username or password");
  });

  it("accepts valid credentials and sets session cookie", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123", rememberMe: true }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(SESSION_COOKIE_NAME);
    expect(setCookie).toContain("Max-Age=");
  });

  it("does not set Max-Age when rememberMe is false", async () => {
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin", password: "admin123", rememberMe: false }),
    });
    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain(SESSION_COOKIE_NAME);
    expect(setCookie).not.toContain("Max-Age=");
  });
});
