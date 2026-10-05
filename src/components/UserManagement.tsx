"use client";

import { useState, type SubmitEvent } from "react";
import type { WhitelistAction } from "@/types";

interface UserManagementProps {
  onlinePlayers: string[];
  whitelistedPlayers: string[];
  whitelistError?: string;
  onWhitelistAction: (action: WhitelistAction, username?: string) => Promise<void>;
  onExecuteCommand: (command: string) => Promise<string>;
  isBusy: boolean;
}

export function UserManagement({
  onlinePlayers,
  whitelistedPlayers,
  whitelistError,
  onWhitelistAction,
  onExecuteCommand,
  isBusy,
}: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<"online" | "whitelist">("online");
  const [whitelistInput, setWhitelistInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAddWhitelist = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const clean = whitelistInput.trim();
    if (!clean) return;
    await onWhitelistAction("add", clean);
    setWhitelistInput("");
  };

  const handleKickPlayer = async (name: string) => {
    const reason = window.prompt(`Kick ${name} from server? Reason (optional):`, "Kicked by Admin");
    if (reason === null) return;
    await onExecuteCommand(reason.trim() ? `kick ${name} ${reason.trim()}` : `kick ${name}`);
  };

  const handleSetGamemode = async (name: string, mode: string) => {
    await onExecuteCommand(`gamemode ${mode} ${name}`);
  };

  const handleOpToggle = async (name: string, isOp: boolean) => {
    if (isOp) {
      if (window.confirm(`Remove OP permissions from ${name}?`)) {
        await onExecuteCommand(`deop ${name}`);
      }
    } else {
      if (window.confirm(`Grant operator (OP) privileges to ${name}?`)) {
        await onExecuteCommand(`op ${name}`);
      }
    }
  };

  const filteredOnline = onlinePlayers.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredWhitelist = whitelistedPlayers.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <span>Player Administration</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage active in-game players, permissions, and server whitelist access.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("online")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === "online"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Active Players</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded-md text-[10px]">
              {onlinePlayers.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("whitelist")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeTab === "whitelist"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>Whitelist Registry</span>
            <span className="px-1.5 py-0.2 bg-black/30 rounded-md text-[10px]">
              {whitelistedPlayers.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by username..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {activeTab === "whitelist" && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onWhitelistAction("on")}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl transition border border-emerald-500/30 font-medium cursor-pointer"
            >
              Turn On
            </button>
            <button
              onClick={() => onWhitelistAction("off")}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-xl transition border border-rose-500/30 font-medium cursor-pointer"
            >
              Turn Off
            </button>
            <button
              onClick={() => onWhitelistAction("reload")}
              disabled={isBusy}
              className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition border border-slate-700 font-medium cursor-pointer"
            >
              Reload
            </button>
          </div>
        )}
      </div>

      {/* Online Players Tab */}
      {activeTab === "online" && (
        <div className="space-y-4">
          {filteredOnline.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <span className="text-3xl">👥</span>
              <p className="text-sm font-semibold text-slate-300 mt-2">
                {searchQuery ? "No matching online players found" : "No players currently online"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                When players connect to your server, they will appear here with instant moderation controls.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOnline.map((name) => (
                <div
                  key={name}
                  className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://mc-heads.net/avatar/${name}/44`}
                        alt={name}
                        className="w-11 h-11 rounded-xl bg-slate-800"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            "https://mc-heads.net/avatar/Steve/44";
                        }}
                      />
                      <div>
                        <h4 className="font-bold text-white text-sm">{name}</h4>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Online
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleKickPlayer(name)}
                      disabled={isBusy}
                      title="Kick player"
                      className="px-2.5 py-1 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition cursor-pointer"
                    >
                      Kick
                    </button>
                  </div>

                  {/* Quick Player Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-400 font-medium">Mode:</span>
                      <button
                        onClick={() => handleSetGamemode(name, "survival")}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition cursor-pointer"
                        title="Set Survival"
                      >
                        Surv
                      </button>
                      <button
                        onClick={() => handleSetGamemode(name, "creative")}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition cursor-pointer"
                        title="Set Creative"
                      >
                        Crea
                      </button>
                      <button
                        onClick={() => handleSetGamemode(name, "spectator")}
                        className="text-[10px] px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition cursor-pointer"
                        title="Set Spectator"
                      >
                        Spec
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpToggle(name, false)}
                        className="text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                      >
                        Grant OP
                      </button>
                      <span className="text-slate-700">•</span>
                      <button
                        onClick={() => onExecuteCommand(`kill ${name}`)}
                        className="text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
                      >
                        Kill
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Whitelist Tab */}
      {activeTab === "whitelist" && (
        <div className="space-y-6">
          {/* Add Player to Whitelist Form */}
          <form
            onSubmit={handleAddWhitelist}
            className="flex gap-2 p-4 bg-slate-900/60 border border-slate-800 rounded-2xl"
          >
            <input
              type="text"
              maxLength={16}
              value={whitelistInput}
              onChange={(e) => setWhitelistInput(e.target.value)}
              placeholder="Enter Minecraft username to whitelist (e.g. Notch, Alex)..."
              disabled={isBusy}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              type="submit"
              disabled={isBusy || !whitelistInput.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>+ Add to Whitelist</span>
            </button>
          </form>

          {whitelistError ? (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-mono">
              {whitelistError}
            </div>
          ) : filteredWhitelist.length === 0 ? (
            <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
              <span className="text-3xl">🛡️</span>
              <p className="text-sm font-semibold text-slate-300 mt-2">
                {searchQuery ? "No matching whitelisted players found" : "No players in whitelist"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Add usernames above to restrict server access to approved players only.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredWhitelist.map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between p-3.5 bg-slate-900/70 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://mc-heads.net/avatar/${name}/36`}
                      alt={name}
                      className="w-9 h-9 rounded-lg bg-slate-800 shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://mc-heads.net/avatar/Steve/36";
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{name}</p>
                      <p className="text-xs text-indigo-400 font-medium">Whitelisted</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${name} from whitelist?`)) {
                        onWhitelistAction("remove", name);
                      }
                    }}
                    disabled={isBusy}
                    title="Remove user"
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition border border-transparent hover:border-rose-500/20 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
