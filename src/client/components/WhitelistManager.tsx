import { useState, type SubmitEvent } from "react";
import type { WhitelistAction } from "../../types.ts";

interface WhitelistManagerProps {
  players: string[];
  errorMessage?: string;
  onAction: (action: WhitelistAction, username?: string) => Promise<void>;
  isLoading: boolean;
}

export function WhitelistManager({
  players,
  errorMessage,
  onAction,
  isLoading,
}: WhitelistManagerProps) {
  const [usernameInput, setUsernameInput] = useState("");

  const handleAdd = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = usernameInput.trim();
    if (!clean) return;
    await onAction("add", clean);
    setUsernameInput("");
  };

  const handleRemove = async (username: string) => {
    if (!window.confirm(`Remove ${username} from whitelist?`)) return;
    await onAction("remove", username);
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>Whitelist Access Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Control player access and grant entry to whitelisted users.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onAction("on")}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 disabled:opacity-50 text-emerald-300 rounded-lg transition border border-emerald-500/30 font-medium cursor-pointer"
          >
            Turn On
          </button>
          <button
            onClick={() => onAction("off")}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-50 text-rose-300 rounded-lg transition border border-rose-500/30 font-medium cursor-pointer"
          >
            Turn Off
          </button>
          <button
            onClick={() => onAction("reload")}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg transition border border-slate-700 font-medium cursor-pointer"
          >
            Reload
          </button>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          maxLength={16}
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
          placeholder="Minecraft username (e.g. Notch, Steve)"
          disabled={isLoading}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
        >
          <span>+ Add to Whitelist</span>
        </button>
      </form>

      {errorMessage ? (
        <div className="text-center py-10 border border-dashed border-rose-900/50 rounded-lg">
          <p className="text-rose-400 text-sm">{errorMessage}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
          <p className="text-slate-400 text-sm">No players currently in whitelist.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((name) => (
            <div
              key={name}
              className="flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-lg hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3">
                <img
                  src={`https://mc-heads.net/avatar/${name}/36`}
                  alt={name}
                  className="w-9 h-9 rounded-md bg-slate-800"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://mc-heads.net/avatar/Steve/36";
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-indigo-400 font-medium">Whitelisted</p>
                </div>
              </div>
              <button
                onClick={() => handleRemove(name)}
                disabled={isLoading}
                title="Remove user"
                className="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition border border-transparent hover:border-rose-500/20 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
