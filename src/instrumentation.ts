export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import required by Next.js instrumentation to isolate Node.js runtime APIs
    const { startChatTailer } = await import("@/server/data/logs/tailer");
    const { startDiscordBot } = await import("@/server/integrations/discordBot");
    const { startBackupScheduler } = await import("@/server/data/backups");

    startChatTailer();
    startDiscordBot();
    startBackupScheduler();
  }
}
