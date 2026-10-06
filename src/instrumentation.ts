export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Dynamic import required by Next.js instrumentation to isolate Node.js runtime APIs
    const { startChatTailer } = await import("@/server/services/chat");
    const { startDiscordBot } = await import("@/server/services/discordBot");

    startChatTailer();
    startDiscordBot();
  }
}
