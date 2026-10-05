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
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p className="text-xs font-medium uppercase text-slate-400">Online Players</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-extrabold text-white">{onlineCount}</span>
          <span className="text-sm text-slate-500">/ {maxCount} max</span>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p className="text-xs font-medium uppercase text-slate-400">Whitelisted Users</p>
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-3xl font-extrabold text-indigo-400">{whitelistCount}</span>
          <span className="text-sm text-slate-500">total</span>
        </div>
      </div>
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p className="text-xs font-medium uppercase text-slate-400">Target Server</p>
        <p className="text-base font-semibold text-white mt-2 font-mono">{serverHost || "-"}</p>
        <p className="text-xs text-slate-500">{serverPort ? `Port ${serverPort}` : "-"}</p>
      </div>
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p className="text-xs font-medium uppercase text-slate-400">Last Synced</p>
        <p className="text-base font-semibold text-white mt-2">{updatedAt || "-"}</p>
        <p className="text-xs text-slate-500">Auto refresh every 4s</p>
      </div>
    </div>
  );
}
