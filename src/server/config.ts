import "server-only";
export const config = {
  rcon: {
    host: process.env.RCON_HOST || "192.168.137.194",
    port: Number(process.env.RCON_PORT) || 25575,
    password: process.env.RCON_PASSWORD || "",
    timeoutMs: Number(process.env.RCON_TIMEOUT_MS) || 5000,
  },
  ssh: {
    host: process.env.SSH_HOST || "mc-server",
    user: process.env.SSH_USER || "oukendev",
  },
  http: {
    port: Number(process.env.PORT) || 3000,
  },
};
