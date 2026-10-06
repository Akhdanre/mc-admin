import { Card, CardLabel, Caption } from "@/components/ui";

interface StatCardsProps {
  onlineCount: number;
  maxCount: number;
  whitelistCount: number;
  serverHost: string;
  serverPort: number;
  updatedAt: string;
}

export function StatCards({
  onlineCount,
  maxCount,
  whitelistCount,
  serverHost,
  serverPort,
  updatedAt,
}: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="rounded-xl">
        <CardLabel>Online Players</CardLabel>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-extrabold text-white">{onlineCount}</span>
          <Caption>/ {maxCount} max</Caption>
        </div>
      </Card>
      <Card className="rounded-xl">
        <CardLabel>Whitelisted Users</CardLabel>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-extrabold text-primary-muted">{whitelistCount}</span>
          <Caption>total</Caption>
        </div>
      </Card>
      <Card className="rounded-xl">
        <CardLabel>Target Server</CardLabel>
        <p className="text-base font-semibold text-white mt-2 font-mono">{serverHost || "-"}</p>
        <Caption>{serverPort ? `Port ${serverPort}` : "-"}</Caption>
      </Card>
      <Card className="rounded-xl">
        <CardLabel>Last Synced</CardLabel>
        <p className="text-base font-semibold text-white mt-2">{updatedAt || "-"}</p>
        <Caption>Auto refresh every 4s</Caption>
      </Card>
    </div>
  );
}
