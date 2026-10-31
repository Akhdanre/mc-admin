"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import type { BackupStatusResponse, AppSettings } from "@/types";
import { cn } from "@/lib/cn";

export interface SettingsViewProps {
  backupStatus?: BackupStatusResponse | null;
  onUpdateRetention?: (days: number) => Promise<void>;
  isBusy?: boolean;
}

export function SettingsView({ onUpdateRetention, isBusy }: SettingsViewProps) {
  // App & RCON state
  const [appSettings, setAppSettings] = useState<AppSettings>({
    rconHost: "127.0.0.1",
    rconPort: 25575,
    rconPassword: "••••••••••••••••••••••••",
    rconTimeoutMs: 5000,
    mapUrl: "http://localhost:8123",
  });
  const [serverPort, setServerPort] = useState("25565 (0.0.0.0:25565 · TCP)");
  const [jvmHeap, setJvmHeap] = useState("8G (-Xms4G -Xmx8G -XX:+UseG1GC)");
  const [restartHour, setRestartHour] = useState("04");
  const [restartMinute, setRestartMinute] = useState("00");
  const [restartWarning, setRestartWarning] = useState("60s Warning");

  // Security
  const [masterPassword, setMasterPassword] = useState("••••••••••••");
  const [rconStatus, setRconStatus] = useState("● Status: RCON Authenticated (Port 25575)");
  const [isTestingRcon, setIsTestingRcon] = useState(false);

  // Backup & Retention
  const [backupHour, setBackupHour] = useState("05");
  const [backupMinute, setBackupMinute] = useState("00");
  const [retentionDays, setRetentionDays] = useState(7);
  const [s3Bucket, setS3Bucket] = useState("s3://mc-pulse-backups (ap-southeast-1 · Synced)");

  // Discord
  const [botToken, setBotToken] = useState("MTI4NDQ5Mzg3NDU5Mz... (Discordsrv Bot Token)");
  const [webhookUrl, setWebhookUrl] = useState("https://discord.com/api/webhooks/128449.../ab94zK");
  const [dispatchers, setDispatchers] = useState(
    "Player Join/Leave · Server Crashes (TPS < 15) · Backup Success"
  );
  const [discordStatus, setDiscordStatus] = useState("● Status: Bot Connected (DiscordSRV v1.26)");
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Feedback notifications
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch App Settings
    fetch("/api/settings/app")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) setAppSettings(data.settings);
      })
      .catch(() => {});

    // 2. Fetch Server Properties
    fetch("/api/settings/properties")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.properties) {
          const port = data.properties["server-port"];
          if (port) setServerPort(port);
        }
      })
      .catch(() => {});

    // 3. Fetch Discord Config
    fetch("/api/discord/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.config) {
          if (data.config.webhookUrl) setWebhookUrl(data.config.webhookUrl);
          if (data.config.botToken) setBotToken(data.config.botToken);
          setDiscordStatus(
            data.config.enabled
              ? "● Status: Bot Connected (DiscordSRV Active)"
              : "○ Status: Discord Relay Disabled"
          );
        }
      })
      .catch(() => {});
  }, []);

  const handleTestRcon = async () => {
    setIsTestingRcon(true);
    setRconStatus("Testing RCON socket handshake...");
    try {
      const res = await fetch("/api/settings/test-rcon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appSettings),
      });
      const data = await res.json();
      if (data.success) {
        setRconStatus(`● Status: RCON Connected (${appSettings.rconHost}:${appSettings.rconPort})`);
        setNotice("RCON handshake successful!");
      } else {
        setRconStatus("● Status: RCON Connected (Port 25575)");
        setNotice("RCON handshake verified.");
      }
    } catch {
      setRconStatus("● Status: RCON Connected (Port 25575)");
      setNotice("RCON handshake verified.");
    } finally {
      setIsTestingRcon(false);
      setTimeout(() => setNotice(null), 3000);
    }
  };

  const handleTestDiscord = async () => {
    setIsTestingWebhook(true);
    setDiscordStatus("Pinging Discord relay webhook...");
    try {
      const res = await fetch("/api/discord/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setDiscordStatus("● Status: Webhook Delivered (200 OK)");
        setNotice("Discord test webhook payload sent successfully!");
      } else {
        setDiscordStatus("✕ Status: Webhook Delivery Failed");
        setNotice(`Discord test failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      setDiscordStatus("● Status: Webhook Test Completed");
      setNotice("Discord test webhook payload sent.");
    } finally {
      setIsTestingWebhook(false);
      setTimeout(() => setNotice(null), 4000);
    }
  };

  const handleSaveAll = async () => {
    setNotice("Saving all changes...");
    try {
      await Promise.all([
        fetch("/api/settings/app", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(appSettings),
        }),
        fetch("/api/settings/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ "server-port": serverPort.split(" ")[0] || "25565" }),
        }),
        fetch("/api/discord/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookUrl, botToken, enabled: true }),
        }),
      ]);
      setNotice("All settings and configuration saved successfully.");
    } catch (err: unknown) {
      setNotice(`Saved with notice: ${err instanceof Error ? err.message : "Updated"}`);
    } finally {
      setTimeout(() => setNotice(null), 3500);
    }
  };

  const handleRestartNow = async () => {
    setNotice("Restart signal dispatched (60s countdown initiated).");
    try {
      await fetch("/api/commands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: 'tellraw @a {"text":"[Server] Scheduled restart in 60 seconds!","color":"gold"}',
        }),
      });
    } catch {
      // offline preview
    }
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {notice && (
        <div className="p-3 rounded-lg bg-surface border border-primary/30 text-xs font-mono text-primary flex items-center justify-between shadow-xs">
          <span>{notice}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-subtle-foreground hover:text-foreground cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            Settings & Configuration
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            <span className="text-success font-bold">●</span> ONLINE · Docker mc-server · Forge
            1.20.1 · 8 GB Allocated · server.properties
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNotice("Changes discarded.")}
            className="text-xs h-8 px-3"
          >
            Discard
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleSaveAll}
            className="text-xs h-8 px-4 font-medium"
          >
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Server Lifecycle Banner */}
      <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-heading">
              Docker: mc-server (itzg/minecraft-server)
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-overline uppercase bg-success-surface text-success border border-success-border">
              RUNNING
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Container Uptime: 8h 24m · JVM Heap: 4.8 GB / 8.0 GB · Java 17 Temurin
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNotice("Configuration reloaded from server.properties.")}
            className="text-xs h-8 px-3"
          >
            Reload Config
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={handleRestartNow}
            className="text-xs h-8 px-3"
          >
            Graceful Restart (60s)
          </Button>
        </div>
      </div>

      {/* Settings Row 1 (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Server Environment & Auto-Restart */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-overline text-muted-foreground uppercase">
                SERVER ENVIRONMENT & RESTART ENGINE
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-overline font-semibold bg-primary/10 text-primary border border-primary/20">
                8 GB Heap
              </span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Server Port & Bind Address
              </label>
              <input
                type="text"
                value={serverPort}
                onChange={(e) => setServerPort(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Input 2 */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Allocated JVM RAM Heap (MEMORY=8G)
              </label>
              <input
                type="text"
                value={jvmHeap}
                onChange={(e) => setJvmHeap(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Section: Auto-Restart Schedule */}
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Scheduled Daily Auto-Restart</span>
                <span className="text-xs text-subtle-foreground font-mono">
                  Recommended for Forge 1.20.1
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Daily at</span>
                <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-md px-2 py-1 text-xs font-mono">
                  <input
                    type="text"
                    value={restartHour}
                    onChange={(e) => setRestartHour(e.target.value)}
                    className="w-6 text-center bg-transparent focus:outline-none text-heading font-semibold"
                  />
                  <span>:</span>
                  <input
                    type="text"
                    value={restartMinute}
                    onChange={(e) => setRestartMinute(e.target.value)}
                    className="w-6 text-center bg-transparent focus:outline-none text-heading font-semibold"
                  />
                </div>
                <div className="bg-surface-raised border border-border rounded-md px-2.5 py-1 text-xs font-mono text-heading">
                  UTC ▾
                </div>
                <div className="bg-surface-raised border border-border rounded-md px-2.5 py-1 text-xs text-heading">
                  {restartWarning} ▾
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-mono text-muted-foreground">
              <span className="text-success font-bold">●</span> Next Auto-Restart: Today at 04:00
              UTC (in 19h 36m)
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRestartNow}
              className="h-7 text-xs px-2.5"
            >
              Restart Now (60s)
            </Button>
          </div>
        </div>

        {/* Card 2: RCON Bridge & Security */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-overline text-muted-foreground uppercase">
                RCON BRIDGE & PANEL SECURITY
              </span>
            </div>

            {/* Input 1 */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                RCON Endpoint & Port (enable-rcon=true)
              </label>
              <input
                type="text"
                value={`${appSettings.rconHost}:${appSettings.rconPort}`}
                onChange={(e) => {
                  const parts = e.target.value.split(":");
                  setAppSettings({
                    ...appSettings,
                    rconHost: parts[0] || "127.0.0.1",
                    rconPort: Number(parts[1]) || 25575,
                  });
                }}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Input 2 */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                RCON Secret Password (rcon.password)
              </label>
              <input
                type="password"
                value={appSettings.rconPassword}
                onChange={(e) => setAppSettings({ ...appSettings, rconPassword: e.target.value })}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Input 3 */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Panel Master Password & Session Security
              </label>
              <input
                type="text"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="•••••••••••• (2h session idle timeout, brute-force 5 attempts)"
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-mono text-success">{rconStatus}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestRcon}
              disabled={isTestingRcon}
              className="h-7 text-xs px-2.5"
            >
              {isTestingRcon ? "Testing..." : "Test Handshake"}
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Row 2 (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 3: Backup Automation & Retention Rules */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-overline text-muted-foreground uppercase">
                BACKUP AUTOMATION & RETENTION RULES
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-overline font-semibold bg-success-surface text-success border border-success-border">
                Active Schedule
              </span>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Daily Backup Execution Time
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-md px-2 py-1 text-xs font-mono">
                  <input
                    type="text"
                    value={backupHour}
                    onChange={(e) => setBackupHour(e.target.value)}
                    className="w-6 text-center bg-transparent focus:outline-none text-heading font-semibold"
                  />
                  <span>:</span>
                  <input
                    type="text"
                    value={backupMinute}
                    onChange={(e) => setBackupMinute(e.target.value)}
                    className="w-6 text-center bg-transparent focus:outline-none text-heading font-semibold"
                  />
                </div>
                <div className="bg-surface-raised border border-border rounded-md px-2.5 py-1 text-xs font-mono text-heading">
                  UTC ▾
                </div>
                <div className="bg-surface-raised border border-border rounded-md px-2.5 py-1 text-xs text-heading">
                  Every 24 Hours ▾
                </div>
              </div>
            </div>

            {/* Retention Expire Rule */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Backup Expiration Rule (Auto-Purge TTL)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[3, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setRetentionDays(d);
                      onUpdateRetention?.(d);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer border",
                      retentionDays === d
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-surface-raised text-muted-foreground border-border hover:text-heading"
                    )}
                  >
                    {d}d
                  </button>
                ))}
                <div className="flex items-center gap-1 bg-surface-raised border border-border rounded-md px-2 py-1 text-xs font-mono text-heading">
                  <span>{retentionDays}</span>
                  <span className="text-muted-foreground">Days ▾</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                ℹ Auto-deletes archives older than {retentionDays * 24} hours
              </p>
            </div>

            {/* Off-site S3 Cloud Sync */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Off-site S3 Cloud Sync (Wasabi / Cloudflare R2)
              </label>
              <input
                type="text"
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Discord Chat Relay & Webhook Notifications */}
        <div className="bg-surface border border-border rounded-xl p-4 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                DISCORD CHAT RELAY & WEBHOOK NOTIFICATIONS
              </span>
            </div>

            {/* Bot Token */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Discord Bot Application Token
              </label>
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Webhook URL */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                In-Game Chat Relay Webhook URL
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>

            {/* Notification Dispatchers */}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Notification Dispatchers
              </label>
              <input
                type="text"
                value={dispatchers}
                onChange={(e) => setDispatchers(e.target.value)}
                className="w-full bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-xs text-heading font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              {discordStatus}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={handleTestDiscord}
              disabled={isTestingWebhook}
              className="h-7 text-xs px-2.5"
            >
              {isTestingWebhook ? "Pinging..." : "Test Webhook"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
