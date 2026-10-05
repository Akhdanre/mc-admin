interface HeaderProps {
  isConnected: boolean;
}

export function Header({ isConnected }: HeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
      <div>
        <div className="flex items-center gap-3">
          <span className="text-3xl">⛏️</span>
          <h1 className="text-2xl font-bold tracking-tight text-white">MC Server Dashboard</h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">Live active players & whitelist access monitor</p>
      </div>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
          isConnected
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
          }`}
        />
        <span>{isConnected ? "Connected" : "Disconnected"}</span>
      </div>
    </header>
  );
}
