"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/Toggle";
import { MOCK_WORLD, type MockGamerule } from "@/lib/mockData";
import { cn } from "@/lib/cn";

export interface WorldControlsProps {
  onExecuteCommand: (command: string) => Promise<string>;
  isBusy: boolean;
  currentDifficulty?: string;
  onRefreshStatus?: () => void;
  onShowFeedback?: (message: string, isError?: boolean) => void;
}

export function WorldControls({
  onExecuteCommand,
  isBusy,
  currentDifficulty,
  onRefreshStatus,
  onShowFeedback,
}: WorldControlsProps) {
  const [activeGamemode, setActiveGamemode] = useState(MOCK_WORLD.gamemode || "survival");
  const [activeDifficulty, setActiveDifficulty] = useState(currentDifficulty || MOCK_WORLD.difficulty || "hard");
  const [activeTime, setActiveTime] = useState<string>("day");
  const [activeWeather, setActiveWeather] = useState<string>("clear");
  const [gamerules, setGamerules] = useState<MockGamerule[]>(MOCK_WORLD.gamerules);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onExecuteCommand("save-all");
      onShowFeedback?.("World saved to disk successfully.");
      onRefreshStatus?.();
    } catch {
      onShowFeedback?.("Failed to execute save-all", true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetTime = async (timeKey: string, tickValue: string) => {
    setActiveTime(timeKey);
    try {
      await onExecuteCommand(`time set ${tickValue}`);
      onShowFeedback?.(`Time set to ${timeKey} (${tickValue})`);
    } catch {
      onShowFeedback?.(`Failed to set time to ${timeKey}`, true);
    }
  };

  const handleSetWeather = async (weather: string) => {
    setActiveWeather(weather);
    try {
      await onExecuteCommand(`weather ${weather}`);
      onShowFeedback?.(`Weather changed to ${weather}`);
    } catch {
      onShowFeedback?.("Failed to change weather", true);
    }
  };

  const handleSetGamemode = async (mode: string) => {
    setActiveGamemode(mode);
    try {
      await onExecuteCommand(`defaultgamemode ${mode}`);
      onShowFeedback?.(`Default gamemode changed to ${mode}`);
    } catch {
      onShowFeedback?.(`Failed to set gamemode to ${mode}`, true);
    }
  };

  const handleSetDifficulty = async (diff: string) => {
    setActiveDifficulty(diff);
    try {
      await onExecuteCommand(`difficulty ${diff}`);
      onShowFeedback?.(`Difficulty updated to ${diff}`);
      onRefreshStatus?.();
    } catch {
      onShowFeedback?.("Failed to set difficulty", true);
    }
  };

  const handleToggleGamerule = async (rule: MockGamerule, nextVal: boolean) => {
    setGamerules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, value: nextVal } : r))
    );
    try {
      await onExecuteCommand(`gamerule ${rule.id} ${nextVal}`);
      onShowFeedback?.(`Gamerule ${rule.name} set to ${nextVal}`);
    } catch {
      onShowFeedback?.(`Failed to update gamerule ${rule.name}`, true);
    }
  };

  const handleUpdateNumberRule = async (rule: MockGamerule, nextVal: number) => {
    setGamerules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, value: nextVal } : r))
    );
    try {
      await onExecuteCommand(`gamerule ${rule.id} ${nextVal}`);
      onShowFeedback?.(`Gamerule ${rule.name} set to ${nextVal}`);
    } catch {
      onShowFeedback?.(`Failed to update gamerule ${rule.name}`, true);
    }
  };

  const handleDimensionAction = async (dimName: string, actionLabel: string, actionVariant: string) => {
    if (actionVariant === "danger") {
      if (
        !window.confirm(
          `Are you sure you want to execute "${actionLabel}" for ${dimName}?\n\nThis will purge and regenerate dimension chunks on server reload.`
        )
      ) {
        return;
      }
    }
    onShowFeedback?.(`${actionLabel} initiated for ${dimName}.`);
  };

  // Group gamerules by Penpot categories
  const gameplayRules = gamerules.filter((r) => r.category === "gameplay");
  const combatRules = gamerules.filter((r) => r.category === "combat");
  const physicsRules = gamerules.filter((r) => r.category === "physics");
  const adminRules = gamerules.filter((r) => r.category === "admin");

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-heading tracking-tight">
            World & Environment
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-heading">ONLINE</span>
            <span>·</span>
            <span>3 Dimensions</span>
            <span>·</span>
            <span className="font-mono">Seed {MOCK_WORLD.seed}</span>
            <span>·</span>
            <span>Autosave {MOCK_WORLD.autosave}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving || isBusy}
            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? "Saving Chunks..." : "Save All Chunks"}
          </button>
        </div>
      </div>

      {/* Row 1: Dimensions & Storage Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MOCK_WORLD.dimensions.map((dim) => {
          const isDanger = dim.actionVariant === "danger";
          return (
            <div
              key={dim.id}
              className="bg-surface border border-border rounded-xl p-3.5 shadow-xs flex flex-col justify-between gap-3.5"
            >
              {/* Top Meta Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm select-none">{dim.icon}</span>
                  <span className="text-sm font-semibold text-heading">{dim.name}</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-muted-foreground">
                  {dim.diskSizeFormatted}
                </span>
              </div>

              {/* Details Row */}
              <div className="space-y-0.5 text-[11px] font-mono">
                <div className="text-slate-500 dark:text-slate-400">
                  Directory: {dim.directory} · {dim.chunksLoaded} Chunks Loaded
                </div>
                <div className="text-muted-foreground">{dim.detail}</div>
              </div>

              {/* Action Row */}
              <div>
                <button
                  type="button"
                  onClick={() => handleDimensionAction(dim.name, dim.actionLabel, dim.actionVariant)}
                  className={cn(
                    "text-xs px-3 py-1 rounded-md font-medium border transition-colors cursor-pointer",
                    isDanger
                      ? "border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/15"
                      : "border-border text-heading bg-surface hover:bg-surface-raised"
                  )}
                >
                  {dim.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Row 2: Environment & Modes Panels Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Panel / Atmospheric & Time Engine */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs flex flex-col justify-between gap-3.5">
          {/* Time Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🌤</span>
              <span className="text-[13px] font-semibold text-heading">
                Atmospheric & Time Engine
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground bg-surface-raised px-2 py-0.5 rounded border border-border">
              {MOCK_WORLD.time} · Tick {MOCK_WORLD.tick.toLocaleString()}
            </span>
          </div>

          {/* Time Scrub Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "day", label: "☀ Day", tick: "t: 1,000", val: "1000" },
              { id: "noon", label: "🌤 Noon", tick: "t: 6,000", val: "6000" },
              { id: "night", label: "🌙 Night", tick: "t: 13,000", val: "13000" },
              { id: "midnight", label: "🌑 Midnight", tick: "t: 18,000", val: "18000" },
            ].map((t) => {
              const isSelected = activeTime === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSetTime(t.id, t.val)}
                  disabled={isBusy}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-colors cursor-pointer",
                    isSelected
                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "border-border bg-surface-raised/40 hover:bg-surface-raised text-heading"
                  )}
                >
                  <span className="text-[11.5px] font-medium">{t.label}</span>
                  <span
                    className={cn(
                      "text-[9.5px] font-mono mt-0.5",
                      isSelected
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {t.tick}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Weather Control Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Weather Cycle:</span>
              <span className="text-slate-400 font-mono text-[11px]">
                ({MOCK_WORLD.weatherCycle})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {[
                { id: "clear", label: "☀ Clear" },
                { id: "rain", label: "🌧 Rain" },
                { id: "thunder", label: "⚡ Thunder" },
              ].map((w) => {
                const isSelected = activeWeather === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => handleSetWeather(w.id)}
                    disabled={isBusy}
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-md font-medium border transition-colors cursor-pointer",
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-surface-raised border-border text-muted-foreground hover:text-heading"
                    )}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel / Server Modes & Difficulty Engine */}
        <div className="bg-surface border border-border rounded-xl p-3.5 shadow-xs flex flex-col justify-between gap-3.5">
          {/* Rules Header Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">⚔</span>
              <span className="text-[13px] font-semibold text-heading">
                Server Modes & Difficulty Engine
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Live Enforced
            </span>
          </div>

          {/* Gamemode Selector Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "survival", label: "Survival", sub: "Core Survival" },
              { id: "creative", label: "Creative", sub: "Unlimited Blocks" },
              { id: "adventure", label: "Adventure", sub: "Immutable World" },
              { id: "spectator", label: "Spectator", sub: "Noclip Flying" },
            ].map((m) => {
              const isSelected = activeGamemode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSetGamemode(m.id)}
                  disabled={isBusy}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-colors cursor-pointer",
                    isSelected
                      ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                      : "border-border bg-surface-raised/40 hover:bg-surface-raised text-heading"
                  )}
                >
                  <span className="text-[11.5px] font-medium">{m.label}</span>
                  <span
                    className={cn(
                      "text-[9.5px] mt-0.5",
                      isSelected
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-muted-foreground"
                    )}
                  >
                    {m.sub}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Difficulty Selector Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">Server Difficulty:</span>

            <div className="inline-flex rounded-lg bg-surface-raised p-0.5 border border-border">
              {["peaceful", "easy", "normal", "hard"].map((diff) => {
                const isSelected = activeDifficulty.toLowerCase() === diff;
                const isHard = diff === "hard";
                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => handleSetDifficulty(diff)}
                    disabled={isBusy}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded-md capitalize transition-colors cursor-pointer",
                      isSelected
                        ? isHard
                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 font-semibold"
                          : "bg-surface text-heading shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-heading"
                    )}
                  >
                    {diff}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Gamerules Row 1 (Gameplay & Mobs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category: Gameplay & Survival Mechanics */}
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="bg-surface-raised border-b border-border px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-heading">
              ⚔ Gameplay & Survival Mechanics
            </span>
            <span className="text-[10.5px] font-mono text-muted-foreground">
              {gameplayRules.length} Rules
            </span>
          </div>
          <div>
            {gameplayRules.map((rule) => (
              <GameruleRow
                key={rule.id}
                rule={rule}
                isBusy={isBusy}
                onToggle={(val) => handleToggleGamerule(rule, val)}
                onUpdateNumber={(val) => handleUpdateNumberRule(rule, val)}
              />
            ))}
          </div>
        </div>

        {/* Category: Mobs, Spawning & Combat */}
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="bg-surface-raised border-b border-border px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-heading">
              👾 Mobs, Spawning & Combat
            </span>
            <span className="text-[10.5px] font-mono text-muted-foreground">
              {combatRules.length} Rules
            </span>
          </div>
          <div>
            {combatRules.map((rule) => (
              <GameruleRow
                key={rule.id}
                rule={rule}
                isBusy={isBusy}
                onToggle={(val) => handleToggleGamerule(rule, val)}
                onUpdateNumber={(val) => handleUpdateNumberRule(rule, val)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Gamerules Row 2 (Environment & Operations) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category: World, Physics & Environment */}
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="bg-surface-raised border-b border-border px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-heading">
              🌍 World, Physics & Environment
            </span>
            <span className="text-[10.5px] font-mono text-muted-foreground">
              {physicsRules.length} Rules
            </span>
          </div>
          <div>
            {physicsRules.map((rule) => (
              <GameruleRow
                key={rule.id}
                rule={rule}
                isBusy={isBusy}
                onToggle={(val) => handleToggleGamerule(rule, val)}
                onUpdateNumber={(val) => handleUpdateNumberRule(rule, val)}
              />
            ))}
          </div>
        </div>

        {/* Category: Chat, Console & Admin Operations */}
        <div className="bg-surface border border-border rounded-xl shadow-xs overflow-hidden">
          <div className="bg-surface-raised border-b border-border px-3.5 py-2.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-heading">
              📢 Chat, Console & Admin Operations
            </span>
            <span className="text-[10.5px] font-mono text-muted-foreground">
              {adminRules.length} Rules
            </span>
          </div>
          <div>
            {adminRules.map((rule) => (
              <GameruleRow
                key={rule.id}
                rule={rule}
                isBusy={isBusy}
                onToggle={(val) => handleToggleGamerule(rule, val)}
                onUpdateNumber={(val) => handleUpdateNumberRule(rule, val)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GameruleRow({
  rule,
  isBusy,
  onToggle,
  onUpdateNumber,
}: {
  rule: MockGamerule;
  isBusy: boolean;
  onToggle: (val: boolean) => void;
  onUpdateNumber: (val: number) => void;
}) {
  return (
    <div className="px-3.5 py-2.5 border-b border-border/50 last:border-b-0 flex items-center justify-between gap-4 hover:bg-surface-raised/30 transition-colors">
      <div className="min-w-0 flex-1 pr-2">
        <div className="text-xs font-mono font-medium text-heading truncate">
          {rule.name}
        </div>
        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
          {rule.description}
        </div>
      </div>

      <div className="shrink-0">
        {rule.type === "number" ? (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-raised border border-border text-[11.5px] font-mono">
            <input
              type="number"
              value={rule.value as number}
              onChange={(e) => onUpdateNumber(Number(e.target.value))}
              disabled={isBusy}
              className="w-14 bg-transparent text-right text-heading focus:outline-none font-mono"
            />
            {rule.unit && (
              <span className="text-[10px] text-muted-foreground select-none">
                {rule.unit}
              </span>
            )}
          </div>
        ) : (
          <Toggle
            checked={Boolean(rule.value)}
            onChange={onToggle}
            disabled={isBusy}
          />
        )}
      </div>
    </div>
  );
}
