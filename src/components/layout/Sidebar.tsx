"use client";

import { useRouter } from "next/navigation";
import { Badge, Button, Caption, Muted, PageTitle } from "@/components/ui";

export type AdminTab = "dashboard" | "users" | "world" | "backups" | "map" | "commands" | "chat" | "settings";

interface SidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onlineCount: number;
  whitelistCount: number;
  backupCount: number;
  isConnected: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
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
}: SidebarProps) {
  const router = useRouter();
  const navItems = [
    {
      id: "dashboard" as AdminTab,
      label: "Dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
      badge: null,
    },
    {
      id: "users" as AdminTab,
      label: "User Management",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      badge: `${onlineCount} / ${whitelistCount}`,
    },
    {
      id: "world" as AdminTab,
      label: "World & Server",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      badge: null,
    },
    {
      id: "backups" as AdminTab,
      label: "Backup Management",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
          />
        </svg>
      ),
      badge: backupCount > 0 ? String(backupCount) : null,
    },
    {
      id: "map" as AdminTab,
      label: "Live Web Map",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
      ),
      badge: "8123",
    },
    {
      id: "commands" as AdminTab,
      label: "RCON Console",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      badge: null,
    },
    {
      id: "chat" as AdminTab,
      label: "In-Game Chat",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
      badge: null,
    },
    {
      id: "settings" as AdminTab,
      label: "Settings",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      badge: null,
    },
  ];

  const content = (
    <aside className="w-64 bg-surface/90 border-r border-border flex flex-col h-full">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl p-2 bg-primary/10 border border-primary/20 rounded-xl">⛏️</span>
          <div>
            <PageTitle className="text-base leading-tight">MC Admin Panel</PageTitle>
            <Muted>Server Management</Muted>
          </div>
        </div>
        {isOpenMobile && (
          <Button
            variant="ghost"
            onClick={onCloseMobile}
            className="md:hidden p-1 rounded-lg hover:bg-transparent"
          >
            ✕
          </Button>
        )}
      </div>

      {/* Connection Indicator */}
      <div className="px-5 py-3 border-b border-border/60 bg-background/40">
        <div className="flex items-center justify-between text-xs">
          <Muted>Server Connection</Muted>
          <Badge
            tone={isConnected ? "success" : "danger"}
            className="font-medium px-2 text-xs"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-success-muted animate-pulse" : "bg-danger-muted"
              }`}
            />
            {isConnected ? "Online" : "Offline"}
          </Badge>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <Caption className="px-3 pt-2 pb-1 text-[11px] font-semibold tracking-wider uppercase">
          Menu
        </Caption>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <Button
              key={item.id}
              variant="tab"
              active={isActive}
              size="md"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full justify-between text-left px-3 py-2.5 font-medium ${
                isActive ? "shadow-lg shadow-primary/20" : "shadow-none"
              }`}
            >
              <span className="flex items-center gap-3 text-left min-w-0">
                <span className={`shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                  {item.icon}
                </span>
                <span className="truncate text-left">{item.label}</span>
              </span>
              {item.badge && (
                <Badge
                  tone={isActive ? "primary" : "neutral"}
                  className={`text-[11px] py-0.5 font-mono font-medium ${
                    isActive
                      ? "bg-white/20 text-white border-transparent"
                      : "bg-surface-raised border-transparent"
                  }`}
                >
                  {item.badge}
                </Badge>
              )}
            </Button>
          );
        })}
      </nav>

      {/* Bottom Footer Info */}
      {/* Bottom Footer Info & Logout */}
      <div className="p-4 border-t border-border bg-background/50 space-y-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-faint-foreground" />
            <span>Dynmap & RCON Enabled</span>
          </div>
          <Caption className="text-[11px] mt-1">Live Map on port 8123</Caption>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="w-full justify-center text-xs text-muted-foreground hover:text-red-400 hover:border-red-500/30"
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } finally {
              router.push("/login");
              router.refresh();
            }
          }}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block w-64 shrink-0">
        <div className="sticky top-0 h-screen">{content}</div>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </>
  );
}
