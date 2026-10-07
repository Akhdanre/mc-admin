import "server-only";

export const config = {
  paths: {
    data: process.env.MC_DATA_PATH || "/data",
    backups: process.env.MC_BACKUPS_PATH || "/backups",
  },
};
