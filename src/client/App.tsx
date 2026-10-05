import { useEffect, useState, useCallback } from "react";
import { Header } from "./components/Header.tsx";
import { StatCards } from "./components/StatCards.tsx";
import { PlayerList } from "./components/PlayerList.tsx";
import { WhitelistManager } from "./components/WhitelistManager.tsx";
import { ConsoleCommand } from "./components/ConsoleCommand.tsx";
import type {
  PlayerStatus,
  WhitelistStatus,
  WhitelistAction,
  ServerInfoResponse,
} from "../types.ts";

export function App() {
  const [playerStatus, setPlayerStatus] = useState<PlayerStatus>({
    onlineCount: 0,
    maxCount: 0,
    players: [],
    raw: "",
    updatedAt: "-",
  });

  const [whitelistStatus, setWhitelistStatus] = useState<WhitelistStatus>({
    players: [],
    raw: "",
    updatedAt: "-",
  });

  const [serverInfo, setServerInfo] = useState<ServerInfoResponse>({
    host: "-",
    port: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isWhitelistBusy, setIsWhitelistBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError?: boolean } | null>(null);

  const showFeedback = (message: string, isError = false) => {
    setFeedback({ message, isError });
    setTimeout(() => {
      setFeedback((current) => (current?.message === message ? null : current));
    }, 5000);
  };

  const fetchStatus = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [statusRes, whitelistRes] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/whitelist"),
      ]);

      const statusData = (await statusRes.json()) as PlayerStatus;
      const whitelistData = (await whitelistRes.json()) as WhitelistStatus;

      setPlayerStatus(statusData);
      setWhitelistStatus(whitelistData);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/info")
      .then((res) => res.json())
      .then((data: ServerInfoResponse) => setServerInfo(data))
      .catch((err) => console.error(err));

    fetchStatus();
    const timer = setInterval(fetchStatus, 4000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleWhitelistAction = async (action: WhitelistAction, username?: string) => {
    setIsWhitelistBusy(true);
    try {
      const res = await fetch("/api/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username }),
      });
      const data = (await res.json()) as {
        result?: string;
        error?: string;
        status?: WhitelistStatus;
      };

      if (data.error) {
        showFeedback(`Error: ${data.error}`, true);
      } else {
        const defaultMsg =
          action === "add"
            ? `Added ${username} to whitelist`
            : action === "remove"
              ? `Removed ${username} from whitelist`
              : `Whitelist ${action} executed`;
        showFeedback(data.result || defaultMsg);

        if (data.status) {
          setWhitelistStatus(data.status);
        } else {
          await fetchStatus();
        }
      }
    } catch (err: unknown) {
      showFeedback(`Error: ${err instanceof Error ? err.message : String(err)}`, true);
    } finally {
      setIsWhitelistBusy(false);
    }
  };

  const handleExecuteCommand = async (command: string): Promise<string> => {
    const res = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command }),
    });
    const data = (await res.json()) as { result?: string; error?: string };
    await fetchStatus();

    if (data.error) {
      throw new Error(data.error);
    }
    return data.result || "Command executed without output";
  };

  const isConnected = !playerStatus.error;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Header isConnected={isConnected} />

        {feedback && (
          <div
            className={`mb-6 p-3 rounded-lg text-xs font-mono border ${
              feedback.isError
                ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <StatCards
          onlineCount={playerStatus.onlineCount}
          maxCount={playerStatus.maxCount}
          whitelistCount={whitelistStatus.players.length}
          serverHost={serverInfo.host}
          serverPort={serverInfo.port}
          updatedAt={playerStatus.updatedAt}
        />

        <PlayerList
          players={playerStatus.players}
          errorMessage={playerStatus.error}
          onRefresh={fetchStatus}
          isRefreshing={isRefreshing}
        />

        <WhitelistManager
          players={whitelistStatus.players}
          errorMessage={whitelistStatus.error}
          onAction={handleWhitelistAction}
          isLoading={isWhitelistBusy}
        />

        <ConsoleCommand onExecute={handleExecuteCommand} />
      </div>
    </div>
  );
}
