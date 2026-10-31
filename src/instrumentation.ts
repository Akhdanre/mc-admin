declare global {
  var __mcInstrumentationStarted: boolean | undefined;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    if (globalThis.__mcInstrumentationStarted) {
      return;
    }
    globalThis.__mcInstrumentationStarted = true;

    // Dynamic import required by Next.js instrumentation to isolate Node.js runtime APIs
    const { startChatTailer, subscribeToChatStream, subscribeToServerEvents } =
      await import("@/server/chat");
    const { startDiscordBot, sendDiscordChatMessage, sendDiscordEvent } =
      await import("@/server/discord");
    const { startBackupScheduler } = await import("@/server/backup");
    const { startRestartScheduler } = await import("@/server/restart");
    startChatTailer();
    subscribeToChatStream((chat) => {
      sendDiscordChatMessage(chat.sender, chat.message, chat.isServer).catch((err) => {
        console.error("[DiscordRelay] Failed sending chat to Discord:", err);
      });
    });
    subscribeToServerEvents((event) => {
      sendDiscordEvent(event.title, event.description, event.color).catch((err) => {
        console.error("[DiscordRelay] Failed sending event to Discord:", err);
      });
    });

    startDiscordBot();
    startBackupScheduler();
    startRestartScheduler();
  }
}
