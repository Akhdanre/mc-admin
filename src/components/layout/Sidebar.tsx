"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

export type AdminTab =
  | "dashboard"
  | "commands"
  | "chat"
  | "users"
  | "whitelist"
  | "map"
  | "world"
  | "mods"
  | "backups"
  | "telemetry"
  | "settings";

interface SidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onlineCount: number;
  whitelistCount: number;
  backupCount: number;
  isConnected: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  serverVersion?: string;
  adminName?: string;
  adminRole?: string;
}

interface NavItem {
  id: AdminTab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: string | number | null;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

function BrandLogo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold font-mono text-sm shadow-xs select-none shrink-0",
        className
      )}
    >
      <svg width="14" height="18" viewBox="0 0 9 13" fill="none">
        <path d="M5.5 0L0 7.5H4L3 13L9 5.5H4.5L5.5 0Z" fill="currentColor" />
      </svg>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z" />
    </svg>
  );
}

function ConsoleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.5 4.5L6 8L2.5 11.5L3.5 12.5L8 8L3.5 3.5L2.5 4.5zm5.5 7h5.5v1.5H8v-1.5z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.5 3h11c.55 0 1 .45 1 1v7c0 .55-.45 1-1 1H5.5L2.5 15V4c0-.55.45-1 1-1z" />
    </svg>
  );
}

function PlayersIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M7 6c1.38 0 2.5-1.12 2.5-2.5S8.38 1 7 1 4.5 2.12 4.5 3.5 5.62 6 7 6zm5 1c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM7 8.5C4.67 8.5 0 9.67 0 12v2h14v-2c0-2.33-4.67-3.5-7-3.5zm5 .5c-.32 0-.7.04-1.11.11 1.05.77 1.61 1.74 1.61 2.89v2H16v-1.5c0-1.83-3.67-2.75-5.5-2.75z" />
    </svg>
  );
}

function WhitelistIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5l5.5 2.2v4.8c0 3.3-2.3 6.4-5.5 7.2-3.2-.8-5.5-3.9-5.5-7.2V3.7L8 1.5z" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M10 2.5L6 4.2 2.3 2.7c-.3-.1-.6.1-.6.4v9.6c0 .3.2.5.5.6L6 14.8l4-1.7 3.7 1.5c.3.1.6-.1.6-.4V4.6c0-.3-.2-.5-.5-.6L10 2.5zm-.5 1.8v8.6L6.5 14.2V5.6l3-1.3z" />
    </svg>
  );
}

function WorldIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8s2.91 6.5 6.5 6.5 6.5-2.91 6.5-6.5S11.59 1.5 8 1.5zM2.8 8c0-.4.05-.8.14-1.2h2.2c-.06.4-.1.8-.1 1.2s.04.8.1 1.2H2.94c-.09-.4-.14-.8-.14-1.2zm3.5 0c0-.4.05-.8.14-1.2h3.12c.09.4.14.8.14 1.2s-.05.8-.14 1.2H6.44c-.09-.4-.14-.8-.14-1.2zm.34-2.4c.3-1 .73-1.9 1.36-2.5.63.6 1.06 1.5 1.36 2.5H6.64zm0 4.8h3.36c-.3 1-.73 1.9-1.36 2.5-.63-.6-1.06-1.5-1.36-2.5z" />
    </svg>
  );
}

function ModsIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1.5L2 4.7v6.6L8 14.5l6-3.2V4.7L8 1.5zm0 1.6l4.4 2.3L8 7.7 3.6 5.4 8 3.1zM3.2 6.5l4.2 2.2v4.8L3.2 11.3V6.5zm9.6 4.8l-4.2 2.2V8.7l4.2-2.2v4.8z" />
    </svg>
  );
}

function BackupsIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 2h12v3H2V2zm1 4h10v7.5c0 .5-.5 1-1 1H4c-.5 0-1-.5-1-1V6zm3 2v1.5h4V8H6z" />
    </svg>
  );
}

function TelemetryIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2 13h12v1.5H2V13zm1.5-1.5l3-4 2.5 3 4-6 1.5 1.5-5.5 8-2.5-3-3 4-1.5-1.5z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm6 2.1l-1.2-.4a4.4 4.4 0 0 0-.4-.9l.7-1.1c.2-.3.1-.7-.1-.9l-1.1-1.1c-.2-.2-.6-.3-.9-.1l-1.1.7a4.4 4.4 0 0 0-.9-.4L8.6 2c-.1-.3-.4-.5-.7-.5H6.3c-.3 0-.6.2-.7.5l-.4 1.2a4.4 4.4 0 0 0-.9.4L3.2 2.9c-.3-.2-.7-.1-.9.1L1.2 4.1c-.2.2-.3.6-.1.9l.7 1.1a4.4 4.4 0 0 0-.4.9L.2 7.6c-.3.1-.5.4-.5.7v1.6c0 .3.2.6.5.7l1.2.4c.1.3.2.6.4.9l-.7 1.1c-.2.3-.1.7.1.9l1.1 1.1c.2.2.6.3.9.1l1.1-.7c.3.2.6.3.9.4l.4 1.2c.1.3.4.5.7.5h1.6c.3 0 .6-.2.7-.5l.4-1.2c.3-.1.6-.2.9-.4l1.1.7c.3.2.7.1.9-.1l1.1-1.1c.2-.2.3-.6.1-.9l-.7-1.1c.2-.3.3-.6.4-.9l1.2-.4c.3-.1.5-.4.5-.7V8.3c0-.3-.2-.6-.5-.7z" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
      <path d="M10.5 11.5L14 8l-3.5-3.5" />
      <path d="M14 8H6" />
    </svg>
  );
}

export function Sidebar({
  currentTab,
  onSelectTab,
  onlineCount,
  whitelistCount,
  backupCount,
  isConnected,
  isOpenMobile,
  onCloseMobile,
  serverVersion = "Paper 1.21.4",
  adminName = "Admin",
  adminRole = "Administrator",
}: SidebarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const navSections: NavSection[] = [
    {
      title: "OVERVIEW",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: () => <DashboardIcon />,
        },
        {
          id: "commands",
          label: "Console & Logs",
          icon: () => <ConsoleIcon />,
        },
        {
          id: "chat",
          label: "Live Chat",
          icon: () => <ChatIcon />,
        },
      ],
    },
    {
      title: "PLAYERS & ACCESS",
      items: [
        {
          id: "users",
          label: "Online Players",
          icon: () => <PlayersIcon />,
          badge: onlineCount > 0 ? onlineCount : null,
        },
        {
          id: "whitelist",
          label: "Access Control",
          icon: () => <WhitelistIcon />,
          badge: whitelistCount > 0 ? whitelistCount : null,
        },
      ],
    },
    {
      title: "WORLD & SERVER",
      items: [
        {
          id: "map",
          label: "Live World Map",
          icon: () => <MapIcon />,
        },
        {
          id: "world",
          label: "World & Environment",
          icon: () => <WorldIcon />,
        },
        {
          id: "mods",
          label: "Mods & Addons",
          icon: () => <ModsIcon />,
        },
      ],
    },
    {
      title: "SYSTEM & MAINTENANCE",
      items: [
        {
          id: "backups",
          label: "Backups & Restore",
          icon: () => <BackupsIcon />,
          badge: backupCount > 0 ? backupCount : null,
        },
        {
          id: "telemetry",
          label: "Host Telemetry",
          icon: () => <TelemetryIcon />,
        },
        {
          id: "settings",
          label: "Settings",
          icon: () => <SettingsIcon />,
        },
      ],
    },
  ];

  const content = (
    <aside className="w-[280px] bg-surface border-r border-border flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="px-4 pt-5 pb-4 border-b border-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandLogo />
          <div className="min-w-0">
            <span className="text-sm font-semibold text-heading tracking-tight block leading-tight">
              Pulse MC
            </span>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5 leading-tight">
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isConnected ? "bg-success animate-pulse" : "bg-danger"
                )}
              />
              <span>{isConnected ? "Online" : "Offline"}</span>
              <span className="text-faint-foreground">·</span>
              <span className="text-subtle-foreground truncate">{serverVersion}</span>
            </div>
          </div>
        </div>

        {isOpenMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface-raised cursor-pointer transition-colors"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-3 space-y-3.5 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <div className="px-2.5 py-1 text-overline text-muted-foreground uppercase">
              {section.title}
            </div>
            {section.items.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={cn(
                    "w-full h-10 sm:h-9 flex items-center justify-between px-2.5 rounded-md text-sm font-normal transition-colors cursor-pointer text-left active:scale-[0.99]",
                    isActive
                      ? "bg-primary/10 dark:bg-primary/15 text-primary-muted font-medium"
                      : "text-foreground hover:bg-surface-raised hover:text-heading"
                  )}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={cn(
                        "shrink-0",
                        isActive ? "text-primary-muted" : "text-subtle-foreground"
                      )}
                    >
                      {item.icon(isActive)}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>

                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={cn(
                        "shrink-0 px-1.5 py-0.5 rounded text-xs font-mono leading-none",
                        isActive
                          ? "bg-primary/15 text-primary-muted font-medium"
                          : "bg-surface-raised text-muted-foreground border border-border/40"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer Session Tile */}
      <div className="p-3 border-t border-border bg-surface">
        <div className="bg-surface-raised border border-border rounded-lg p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center shrink-0">
              {adminName.slice(0, 2).toUpperCase() || "AO"}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-heading leading-tight truncate">
                {adminName}
              </div>
              <div className="text-xs text-muted-foreground leading-tight truncate">
                {adminRole}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-danger-foreground hover:bg-danger-surface transition-colors cursor-pointer shrink-0 active:scale-95"
          >
            <SignOutIcon />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block w-[280px] shrink-0">
        <div className="sticky top-0 h-screen">{content}</div>
      </div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-[280px] max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
