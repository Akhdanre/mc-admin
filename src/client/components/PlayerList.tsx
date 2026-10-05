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
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>Active Players</span>
        </h2>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 rounded-lg transition border border-slate-700 cursor-pointer"
        >
          {isRefreshing ? "Syncing..." : "Sync Now"}
        </button>
      </div>

      {errorMessage ? (
        <div className="text-center py-10 border border-dashed border-rose-900/50 rounded-lg">
          <p className="text-rose-400 text-sm">Failed to connect: {errorMessage}</p>
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-slate-800 rounded-lg">
          <p className="text-slate-400 text-sm">No players currently online in the server.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {players.map((name) => (
            <div
              key={name}
              className="flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-lg hover:border-slate-700 transition"
            >
              <img
                src={`https://mc-heads.net/avatar/${name}/36`}
                alt={name}
                className="w-9 h-9 rounded-md bg-slate-800"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://mc-heads.net/avatar/Steve/36";
                }}
              />
              <div>
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="text-xs text-emerald-400 font-medium">In Game</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
