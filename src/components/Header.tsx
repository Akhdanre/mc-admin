import { Badge, Body, PageTitle } from "@/components/ui";

interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border pb-6 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">⛏️</span>
          <PageTitle className="text-2xl">MC Server Dashboard</PageTitle>
        </div>
        <Body className="text-muted-foreground mt-1">
          Live active players & whitelist access monitor
        </Body>
      </div>
      <Badge
        tone={isConnected ? "success" : "danger"}
        className="gap-2 px-3 py-1.5 text-xs"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-success-muted animate-pulse" : "bg-danger-muted"
          }`}
        />
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
      </Badge>
    </header>
  );
}
