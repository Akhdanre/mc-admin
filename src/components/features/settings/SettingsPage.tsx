"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, SectionTitle, Muted, Badge } from "@/components/ui";
import type { BackupStatusResponse } from "@/types";

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
