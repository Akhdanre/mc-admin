"use client";

import { Button, Card, Badge } from "@/components/ui";

interface PlayerListProps {
  players: string[];
  errorMessage?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function PlayerList({
  players,
  errorMessage,
  onRefresh,
  isRefreshing,
}: PlayerListProps) {
  return (
    <Card className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-heading flex items-center gap-2">
          <span>Active Players</span>
        </h2>
        <Button
          variant="secondary"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      {errorMessage ? (
        <Card tone="muted" padding="none" className="text-center py-10 border-rose-900/50">
          <p className="text-danger-muted text-sm">Failed to connect: {errorMessage}</p>
        </Card>
      ) : players.length === 0 ? (
        <Card tone="muted" padding="none" className="text-center py-10">
          <p className="text-muted-foreground text-sm">No players currently online in the server.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((name) => (
            <Card
              key={name}
              tone="solid"
              padding="none"
              className="flex items-center gap-3 p-3 bg-background/80 border-border rounded-lg hover:border-border-strong"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc-heads.net/avatar/${name}/36`}
                alt={name}
                className="w-9 h-9 rounded-md bg-surface-raised"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://mc-heads.net/avatar/Steve/36";
                }}
              />
              <div>
                <p className="text-sm font-semibold text-heading">{name}</p>
                <Badge tone="success" className="mt-0.5">In Game</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
}
