"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, SectionTitle, Muted, Badge } from "@/components/ui";
import type { BackupStatusResponse, DiscordConfig, AppSettings } from "@/types";

interface SettingsPageProps {
  backupStatus?: BackupStatusResponse | null;
  onUpdateRetention?: (days: number) => Promise<void>;
  isBusy?: boolean;
}

export function SettingsPage({
  backupStatus,
  onUpdateRetention,
  isBusy,
}: SettingsPageProps) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [retentionDays, setRetentionDays] = useState(
    backupStatus?.retentionDays || 7
  );
  const [isUpdatingRetention, setIsUpdatingRetention] = useState(false);
  // Discord Webhook State
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig>({
    webhookUrl: "",
    enabled: false,
    relayChat: true,
    relayEvents: true,
  });
  const [isSavingDiscord, setIsSavingDiscord] = useState(false);
  const [isTestingDiscord, setIsTestingDiscord] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Server & Map Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>({
    rconHost: "mc-server",
    rconPort: 25575,
    rconPassword: "",
    rconTimeoutMs: 5000,
    mapUrl: "http://localhost:8123",
  });
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [isTestingRcon, setIsTestingRcon] = useState(false);
  const [appSettingsStatus, setAppSettingsStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [rconTestStatus, setRconTestStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    const loadDiscord = async () => {
      try {
        const res = await fetch("/api/discord/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.config) setDiscordConfig(data.config);
        }
      } catch {
        // ignore
      }
    };
    loadDiscord();

    const loadAppSettings = async () => {
      try {
        const res = await fetch("/api/settings/app");
        if (res.ok) {
          const data = await res.json();
          if (data.settings) setAppSettings(data.settings);
        }
      } catch {
        // ignore
      }
    };
    loadAppSettings();
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: "New passwords do not match" });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({
        success: false,
        message: "New password must be at least 6 characters",
      });
      return;
    }

    setIsChangingPass(true);
    setPasswordStatus(null);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPasswordStatus({
          success: false,
          message: data.error || "Failed to update password",
        });
      } else {
        setPasswordStatus({
          success: true,
          message: "Password updated successfully!",
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setPasswordStatus({
        success: false,
        message: "Network error occurred",
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleRetentionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateRetention) return;
    setIsUpdatingRetention(true);
    try {
      await onUpdateRetention(Number(retentionDays));
    } finally {
      setIsUpdatingRetention(false);
    }
  };
  const handleSaveDiscord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingDiscord(true);
    setDiscordStatus(null);
    try {
      const res = await fetch("/api/discord/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordConfig),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setDiscordStatus({ success: false, message: data.error || "Failed to save" });
      } else {
        setDiscordStatus({ success: true, message: "Discord settings saved successfully!" });
        if (data.config) setDiscordConfig(data.config);
      }
    } catch {
      setDiscordStatus({ success: false, message: "Network error saving settings" });
    } finally {
      setIsSavingDiscord(false);
    }
  };

  const handleTestDiscord = async () => {
    if (!discordConfig.webhookUrl) return;
    setIsTestingDiscord(true);
    setDiscordStatus(null);
    try {
      const res = await fetch("/api/discord/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: discordConfig.webhookUrl }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDiscordStatus({ success: false, message: data.error || "Webhook test failed" });
      } else {
        setDiscordStatus({ success: true, message: "Test message sent to Discord!" });
      }
    } catch {
      setDiscordStatus({ success: false, message: "Network error testing webhook" });
    } finally {
      setIsTestingDiscord(false);
    }
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingApp(true);
    setAppSettingsStatus(null);
    try {
      const res = await fetch("/api/settings/app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appSettings),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAppSettingsStatus({ success: false, message: data.error || "Failed to save settings" });
      } else {
        setAppSettingsStatus({ success: true, message: "Server connection & map settings saved!" });
        if (data.settings) setAppSettings(data.settings);
      }
    } catch {
      setAppSettingsStatus({ success: false, message: "Network error saving settings" });
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleTestRcon = async () => {
    setIsTestingRcon(true);
    setRconTestStatus(null);
    try {
      const res = await fetch("/api/settings/test-rcon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appSettings),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRconTestStatus({ success: false, message: data.error || "Connection failed" });
      } else {
        setRconTestStatus({ success: true, message: data.message || "RCON connected successfully!" });
      }
    } catch {
      setRconTestStatus({ success: false, message: "Network error testing RCON" });
    } finally {
      setIsTestingRcon(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Server & RCON Connection Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <SectionTitle className="text-base font-semibold">
              Minecraft Server Connection (RCON)
            </SectionTitle>
            <Muted className="text-xs mt-0.5">
              Configure host, port, and credentials to communicate with Minecraft
            </Muted>
          </div>
          <Badge tone="primary" className="text-xs">
            Live Connection
          </Badge>
        </div>

        <form onSubmit={handleSaveApp} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                RCON Host
              </label>
              <Input
                value={appSettings.rconHost}
                onChange={(e) => setAppSettings((p) => ({ ...p, rconHost: e.target.value }))}
                placeholder="mc-server or 127.0.0.1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Port
              </label>
              <Input
                type="number"
                value={appSettings.rconPort}
                onChange={(e) => setAppSettings((p) => ({ ...p, rconPort: Number(e.target.value) }))}
                placeholder="25575"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                RCON Password
              </label>
              <Input
                type="password"
                value={appSettings.rconPassword}
                onChange={(e) => setAppSettings((p) => ({ ...p, rconPassword: e.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Timeout (ms)
              </label>
              <Input
                type="number"
                value={appSettings.rconTimeoutMs}
                onChange={(e) => setAppSettings((p) => ({ ...p, rconTimeoutMs: Number(e.target.value) }))}
                placeholder="5000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Live Web Map URL
            </label>
            <Input
              value={appSettings.mapUrl}
              onChange={(e) => setAppSettings((p) => ({ ...p, mapUrl: e.target.value }))}
              placeholder="http://localhost:8123 or https://map.yourdomain.com"
            />
            <Muted className="text-[11px] mt-1">
              Used by the Live Web Map view tab (e.g. Dynmap, BlueMap, Squaremap)
            </Muted>
          </div>

          {appSettingsStatus && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                appSettingsStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              {appSettingsStatus.message}
            </div>
          )}

          {rconTestStatus && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                rconTestStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              {rconTestStatus.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary" disabled={isSavingApp}>
              {isSavingApp ? "Saving..." : "Save Connection & Map Settings"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleTestRcon}
              disabled={isTestingRcon || isSavingApp}
            >
              {isTestingRcon ? "Testing..." : "Test RCON Connection"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Admin Password Change */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <SectionTitle className="text-base font-semibold">
              Change Admin Password
            </SectionTitle>
            <Muted className="text-xs mt-0.5">
              Update password used to log in to this admin panel
            </Muted>
          </div>
          <Badge tone="neutral" className="text-xs">
            User: admin
          </Badge>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="current-pass"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Current Password
            </label>
            <Input
              id="current-pass"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isChangingPass}
            />
          </div>

          <div>
            <label
              htmlFor="new-pass"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              New Password
            </label>
            <Input
              id="new-pass"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isChangingPass}
            />
          </div>

          <div>
            <label
              htmlFor="confirm-pass"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Confirm New Password
            </label>
            <Input
              id="confirm-pass"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isChangingPass}
            />
          </div>

          {passwordStatus && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                passwordStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              {passwordStatus.message}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={
              isChangingPass ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
          >
            {isChangingPass ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </Card>

      {/* Backup Retention Settings */}
      {onUpdateRetention && (
        <Card className="p-6">
          <SectionTitle className="text-base font-semibold mb-1">
            Backup Retention Policy
          </SectionTitle>
          <Muted className="text-xs mb-4">
            Automatically remove backup archives older than this threshold
          </Muted>

          <form
            onSubmit={handleRetentionSubmit}
            className="flex items-center gap-3 max-w-sm"
          >
            <Input
              type="number"
              min="1"
              max="365"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              disabled={isBusy || isUpdatingRetention}
            />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Days
            </span>
            <Button
              type="submit"
              variant="secondary"
              disabled={isBusy || isUpdatingRetention}
            >
              {isUpdatingRetention ? "Saving..." : "Save"}
            </Button>
          </form>
        </Card>
      )}
      {/* Discord Webhook Integration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <SectionTitle className="text-base font-semibold">
              Discord Webhook Integration
            </SectionTitle>
            <Muted className="text-xs mt-0.5">
              Relay in-game Minecraft chat and player join/leave events directly to Discord
            </Muted>
          </div>
          <Badge
            tone={discordConfig.enabled && discordConfig.webhookUrl ? "success" : "neutral"}
            className="text-xs"
          >
            {discordConfig.enabled && discordConfig.webhookUrl ? "Active" : "Disabled"}
          </Badge>
        </div>

        <form onSubmit={handleSaveDiscord} className="space-y-4 max-w-xl">
          <div>
            <label
              htmlFor="webhook-url"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5"
            >
              Discord Webhook URL
            </label>
            <Input
              id="webhook-url"
              type="password"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordConfig.webhookUrl}
              onChange={(e) =>
                setDiscordConfig((prev) => ({ ...prev, webhookUrl: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={discordConfig.enabled}
                onChange={(e) =>
                  setDiscordConfig((prev) => ({ ...prev, enabled: e.target.checked }))
                }
                className="rounded border-border text-primary focus:ring-primary/40"
              />
              <span>Enable Discord Webhook</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={discordConfig.relayChat}
                onChange={(e) =>
                  setDiscordConfig((prev) => ({ ...prev, relayChat: e.target.checked }))
                }
                className="rounded border-border text-primary focus:ring-primary/40"
              />
              <span>Relay in-game chat messages</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={discordConfig.relayEvents}
                onChange={(e) =>
                  setDiscordConfig((prev) => ({ ...prev, relayEvents: e.target.checked }))
                }
                className="rounded border-border text-primary focus:ring-primary/40"
              />
              <span>Relay player join / leave events</span>
            </label>
          </div>

          {/* 2-Way Discord to Minecraft Bot Configuration */}
          <div className="pt-4 border-t border-border/80 space-y-3">
            <div>
              <span className="text-xs font-semibold text-foreground">
                Discord to Minecraft Bot (Optional)
              </span>
              <Muted className="text-[11px] mt-0.5">
                Allows messages typed in a Discord channel to appear in Minecraft chat
              </Muted>
            </div>

            <div>
              <label
                htmlFor="bot-token"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Discord Bot Token
              </label>
              <Input
                id="bot-token"
                type="password"
                placeholder="Bot Token from Discord Developer Portal"
                value={discordConfig.botToken || ""}
                onChange={(e) =>
                  setDiscordConfig((prev) => ({ ...prev, botToken: e.target.value }))
                }
              />
            </div>

            <div>
              <label
                htmlFor="bot-channel"
                className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1"
              >
                Discord Channel ID
              </label>
              <Input
                id="bot-channel"
                type="text"
                placeholder="e.g. 123456789012345678"
                value={discordConfig.botChannelId || ""}
                onChange={(e) =>
                  setDiscordConfig((prev) => ({ ...prev, botChannelId: e.target.value }))
                }
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(discordConfig.relayDiscordToMinecraft)}
                onChange={(e) =>
                  setDiscordConfig((prev) => ({
                    ...prev,
                    relayDiscordToMinecraft: e.target.checked,
                  }))
                }
                className="rounded border-border text-primary focus:ring-primary/40"
              />
              <span>Relay Discord channel messages into Minecraft in-game</span>
            </label>
          </div>
          {discordStatus && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                discordStatus.success
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                  : "bg-red-500/10 border-red-500/20 text-red-500"
              }`}
            >
              {discordStatus.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={isSavingDiscord || isTestingDiscord}
            >
              {isSavingDiscord ? "Saving..." : "Save Discord Settings"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleTestDiscord}
              disabled={!discordConfig.webhookUrl || isTestingDiscord || isSavingDiscord}
            >
              {isTestingDiscord ? "Testing..." : "Send Test Ping"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Session Management */}
      <Card className="p-6">
        <SectionTitle className="text-base font-semibold mb-1">
          Session & Sign Out
        </SectionTitle>
        <Muted className="text-xs mb-4">
          End your active admin session on this device
        </Muted>
        <Button variant="danger" onClick={handleLogout}>
          Sign Out of Dashboard
        </Button>
      </Card>
    </div>
  );
}
