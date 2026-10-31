import { z } from "zod";

export const commandSchema = z.object({
  command: z
    .string()
    .trim()
    .min(1, "Command cannot be empty")
    .max(2000, "Command exceeds maximum length"),
});

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const appSettingsPatchSchema = z.object({
  rconHost: z.string().trim().optional(),
  rconPort: z.number().int().min(1).max(65535).optional(),
  rconPassword: z.string().optional(),
  rconTimeoutMs: z.number().int().min(500).max(60000).optional(),
  mapUrl: z.string().trim().optional(),
});

export const backupActionSchema = z.object({
  action: z.enum(["trigger", "delete", "retention", "restore"]).optional(),
  filename: z
    .string()
    .min(1)
    .max(255)
    .refine((name) => !name.includes("/") && !name.includes("\\"), {
      message: "Path traversal characters are prohibited",
    })
    .optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
});

export const whitelistActionSchema = z.object({
  action: z.enum(["add", "remove", "reload", "on", "off"]),
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_]{1,16}$/, "Invalid Minecraft username")
    .optional(),
});

export const accessControlActionSchema = z.object({
  action: z.enum([
    "add",
    "remove",
    "reload",
    "on",
    "off",
    "ban",
    "unban",
    "ban-ip",
    "unban-ip",
    "op",
    "deop",
  ]),
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_]{1,16}$/, "Invalid Minecraft username")
    .optional(),
  reason: z.string().max(255).optional(),
  ip: z.string().max(64).optional(),
});

export const sendChatSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(500, "Message too long"),
});

export const teleportSchema = z.object({
  player: z.string().regex(/^[a-zA-Z0-9_]{1,16}$/, "Invalid player username"),
  targetPlayer: z
    .string()
    .regex(/^[a-zA-Z0-9_]{1,16}$/, "Invalid target player")
    .optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  z: z.number().optional(),
});
