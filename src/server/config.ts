import "server-only";

export const config = {
  rcon: {
    host: process.env.RCON_HOST || "mc-server",
    port: Number(process.env.RCON_PORT) || 25575,
    password: process.env.RCON_PASSWORD || "",
    timeoutMs: Number(process.env.RCON_TIMEOUT_MS) || 5000,
  },
  paths: {
    data: process.env.MC_DATA_PATH || "/data",
    backups: process.env.MC_BACKUPS_PATH || "/backups",
  },
};
