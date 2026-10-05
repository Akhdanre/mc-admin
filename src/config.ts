import "dotenv/config";

export interface AppConfig {
  rcon: {
    host: string;
    port: number;
    password: string;
    timeoutMs: number;
  };
  http: {
    port: number;
  };
}

export const config: AppConfig = {
  rcon: {
    host: process.env.RCON_HOST || "192.168.137.158",
    port: Number(process.env.RCON_PORT) || 25575,
    password: process.env.RCON_PASSWORD || "",
    timeoutMs: Number(process.env.RCON_TIMEOUT_MS) || 5000,
  },
  http: {
    port: Number(process.env.PORT) || 3000,
  },
};
