"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

export default function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const canSubmit = Boolean(username.trim() && password.trim() && !loading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : (data.error && typeof data.error === "object" && data.error.message) ||
              "Invalid username or password.";
        setError(errorMsg);
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative font-sans">
      <div className="w-full max-w-[400px]">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-xs">
            <svg width="14" height="18" viewBox="0 0 9 13" fill="none">
              <path d="M5.5 0L0 7.5H4L3 13L9 5.5H4.5L5.5 0Z" fill="currentColor" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-heading tracking-tight">Pulse MC</span>
        </div>

        {/* Login Card */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-xs">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-heading leading-tight">Sign in</h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              Access the Minecraft server control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold text-muted-foreground mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                disabled={loading}
                className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-muted-foreground mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  disabled={loading}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 pr-10 text-sm text-foreground placeholder:text-faint-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle-foreground hover:text-foreground cursor-pointer transition p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((v) => !v)}
                className="flex items-center gap-2 cursor-pointer select-none group text-left"
              >
                <span
                  className={cn(
                    "w-[18px] h-[18px] rounded-[4px] border flex items-center justify-center transition-colors shrink-0",
                    rememberMe
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border-strong bg-surface group-hover:border-primary"
                  )}
                >
                  {rememberMe && (
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 14 14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="2.5 7.5 5.5 10.5 11.5 3.5" />
                    </svg>
                  )}
                </span>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Remember this device
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setError("Contact server operator or inspect server config to reset credentials.")
                }
                className="text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-danger-surface border border-danger-border text-danger-foreground text-xs flex items-center gap-2">
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "w-full h-10 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs",
                canSubmit
                  ? "bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer active:scale-[0.99]"
                  : "bg-surface-raised text-faint-foreground border border-border cursor-not-allowed"
              )}
            >
              {loading ? (
                "Authenticating..."
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <polyline points="10 17 15 12 10 7" />
                    <line x1="15" y1="12" x2="3" y2="12" />
                  </svg>
                  <span>Sign in</span>
                </>
              )}
            </button>

            <div className="border-t border-border w-full pt-1" />

            <p className="text-xs font-mono text-subtle-foreground">v1.21.4</p>
          </form>
        </div>
      </div>
    </div>
  );
}
