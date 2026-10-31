"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { MockPlayerDetail, MockInventoryItem } from "@/lib/mockData";
import { cn } from "@/lib/cn";

export interface PlayerInventoryModalProps {
  player: MockPlayerDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onAction?: (action: string, player: MockPlayerDetail) => void;
}

const ITEM_ICONS: Record<string, string> = {
  netherite_sword: "🗡️",
  netherite_pickaxe: "⛏️",
  diamond_pickaxe: "⛏️",
  diamond_sword: "🗡️",
  iron_pickaxe: "⛏️",
  bow: "🏹",
  golden_apple: "🍏",
  cooked_beef: "🥩",
  cooked_porkchop: "🥩",
  ender_pearl: "🔮",
  firework_rocket: "🎆",
  totem_of_undying: "🗿",
  netherite_helmet: "⛑️",
  elytra: "🪽",
  netherite_chestplate: "🦺",
  netherite_leggings: "👖",
  netherite_boots: "🥾",
  diamond_block: "💎",
  shulker_box: "📦",
  experience_bottle: "🧪",
  oak_log: "🪵",
  spruce_wood: "🪵",
  iron_ingot: "🪙",
  raw_iron: "🪨",
  coal: "⚫",
  bread: "🍞",
  torch: "🔦",
  redstone: "🔴",
  repeater: "🎚️",
  comparator: "🎛️",
  stone_bricks: "🧱",
  glass: "🪟",
  water_bucket: "🪣",
};

export function PlayerInventoryModal({
  player,
  isOpen,
  onClose,
  onAction,
}: PlayerInventoryModalProps) {
  const [activeSlotItem, setActiveSlotItem] = useState<{
    item?: MockInventoryItem;
    slotLabel: string;
  } | null>(null);

  if (!player) return null;

  const armorSlots = [
    { slot: 39, name: "Helmet", icon: "⛑️" },
    { slot: 38, name: "Chestplate", icon: "🦺" },
    { slot: 37, name: "Leggings", icon: "👖" },
    { slot: 36, name: "Boots", icon: "🥾" },
  ];
  const offhandSlot = { slot: 40, name: "Offhand", icon: "🛡️" };

  const getItemAtSlot = (slotNum: number): MockInventoryItem | undefined => {
    return player.inventory.find((i) => i.slot === slotNum);
  };

  const occupiedCount = player.inventory.filter((i) => i.slot >= 0 && i.slot < 27).length;

  const renderSlot = (slotNum: number, label: string, silhouetteIcon?: string) => {
    const item = getItemAtSlot(slotNum);
    const icon = item ? ITEM_ICONS[item.id] || "📦" : silhouetteIcon;
    const isSelected = activeSlotItem?.slotLabel === label;

    return (
      <div
        key={slotNum}
        onMouseEnter={() => setActiveSlotItem({ item, slotLabel: label })}
        onClick={() => setActiveSlotItem({ item, slotLabel: label })}
        className={cn(
          "w-12 h-12 rounded-lg border flex items-center justify-center relative select-none transition-all group cursor-pointer",
          isSelected
            ? "border-primary ring-2 ring-primary/30 bg-surface-elevated z-10 scale-105"
            : item
              ? "bg-surface border-border hover:border-primary/60 hover:bg-surface-raised shadow-xs"
              : "bg-surface/40 border-border/40 hover:border-border text-muted-foreground/30"
        )}
      >
        {item ? (
          <>
            <span className="text-2xl select-none group-hover:scale-110 transition-transform">
              {icon}
            </span>

            {/* Stack count badge */}
            {item.count > 1 && (
              <span className="absolute bottom-1 right-1 font-mono font-bold text-[11px] text-white bg-slate-900/85 px-1 py-0.2 rounded-xs leading-none shadow-xs select-none pointer-events-none">
                {item.count}
              </span>
            )}

            {/* Durability bar */}
            {item.durability && (
              <div className="absolute bottom-1 left-1.5 right-1.5 h-1 bg-slate-900/80 rounded-full overflow-hidden pointer-events-none">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    item.durability.current / item.durability.max > 0.5
                      ? "bg-emerald-500"
                      : item.durability.current / item.durability.max > 0.2
                        ? "bg-amber-500"
                        : "bg-rose-500"
                  )}
                  style={{
                    width: `${Math.round((item.durability.current / item.durability.max) * 100)}%`,
                  }}
                />
              </div>
            )}
          </>
        ) : (
          <span className="text-lg opacity-25 select-none">{silhouetteIcon || ""}</span>
        )}

        {/* Hotbar slot number (1-9) */}
        {slotNum >= 27 && slotNum <= 35 && (
          <span className="absolute top-0.5 left-1 text-[9px] font-mono text-muted-foreground/40 select-none">
            {slotNum - 26}
          </span>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Inventory: ${player.username}`}
      description={`UUID: ${player.uuid} · ${player.dimension.replace("the_", "")} (${player.x.toFixed(0)}, ${player.y.toFixed(0)}, ${player.z.toFixed(0)})`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Top Summary & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-raised rounded-xl border border-border">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://mc-heads.net/avatar/${player.username}/44`}
              alt={player.username}
              className="w-11 h-11 rounded-lg bg-surface border border-border shadow-xs shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "https://mc-heads.net/avatar/Steve/44";
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-heading">{player.username}</span>
                <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  {player.role}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                <span>❤️ {player.health}/20</span>
                <span>🍗 {player.food}/20</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  ✨ Level {player.xpLevel}
                </span>
                <span>📶 {player.ping}ms</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction?.("heal", player)}
              className="text-xs h-7 px-2.5"
            >
              Heal
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction?.("feed", player)}
              className="text-xs h-7 px-2.5"
            >
              Feed
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => {
                if (window.confirm(`Clear inventory for player ${player.username}?`)) {
                  onAction?.("clear", player);
                }
              }}
              className="text-xs h-7 px-2.5"
            >
              Clear Inventory
            </Button>
          </div>
        </div>

        {/* Equipment & Armor Row */}
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Equipped Armor & Offhand
          </div>
          <div className="flex items-center justify-center gap-2.5 p-3 bg-surface-raised/40 border border-border/70 rounded-xl">
            {armorSlots.map((slot) => renderSlot(slot.slot, `Armor: ${slot.name}`, slot.icon))}
            <div className="w-px h-8 bg-border mx-1" />
            {renderSlot(offhandSlot.slot, `Offhand: Shield/Totem`, offhandSlot.icon)}
          </div>
        </div>

        {/* 27-Slot Main Inventory (3 rows of 9) */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            <span>Main Storage (27 Slots)</span>
            <span className="text-xs font-mono lowercase font-normal">
              {occupiedCount}/27 slots used
            </span>
          </div>
          <div className="grid grid-cols-9 gap-2 p-3 bg-surface-raised/40 border border-border/80 rounded-xl justify-items-center">
            {Array.from({ length: 27 }, (_, i) => renderSlot(i, `Main Slot ${i + 1}`))}
          </div>
        </div>

        {/* 9-Slot Hotbar */}
        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Quick Hotbar (9 Slots)
          </div>
          <div className="grid grid-cols-9 gap-2 p-3 bg-surface-raised border border-border rounded-xl justify-items-center">
            {Array.from({ length: 9 }, (_, i) => renderSlot(27 + i, `Hotbar Slot ${i + 1}`))}
          </div>
        </div>

        {/* Active Inspected Item Footer */}
        <div className="p-3 bg-surface-raised/80 rounded-xl border border-border min-h-[58px] flex items-center justify-between gap-3 text-xs">
          {activeSlotItem?.item ? (
            <div className="flex items-center gap-3 w-full">
              <span className="text-2xl shrink-0 select-none">
                {ITEM_ICONS[activeSlotItem.item.id] || "📦"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-heading truncate">
                    {activeSlotItem.item.name}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-primary">
                    x{activeSlotItem.item.count}
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-surface px-1.5 py-0.5 rounded border border-border">
                    {activeSlotItem.slotLabel}
                  </span>
                </div>
                {activeSlotItem.item.lore && (
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {activeSlotItem.item.lore.map((lore, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                      >
                        {lore}
                      </span>
                    ))}
                  </div>
                )}
                {activeSlotItem.item.durability && (
                  <div className="text-[10.5px] font-mono text-muted-foreground mt-0.5">
                    Durability: {activeSlotItem.item.durability.current} /{" "}
                    {activeSlotItem.item.durability.max} (
                    {Math.round(
                      (activeSlotItem.item.durability.current / activeSlotItem.item.durability.max) *
                        100
                    )}
                    %)
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-xs flex items-center gap-2">
              <span>💡</span>
              <span>
                {activeSlotItem
                  ? `${activeSlotItem.slotLabel}: Empty Slot`
                  : "Hover or click any slot to inspect item stats, lore, and durability"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
