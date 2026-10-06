"use client";

import { useState, type SubmitEvent } from "react";

interface LiveMapProps {
  mapUrl?: string;
}

export function LiveMap({ mapUrl = "http://192.168.137.194:8123" }: LiveMapProps) {
  const [currentUrl, setCurrentUrl] = useState(mapUrl);
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [customInput, setCustomInput] = useState(mapUrl);

  const handleSaveUrl = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (customInput.trim()) {
      setCurrentUrl(customInput.trim());
      setIsEditingUrl(false);
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      {/* Map Control Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-lg">🗺️</div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>Dynmap Live Web Map</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Port 8123
              </span>
            </h2>
            <p className="text-xs text-slate-400">Live 2D / isometric world viewer and real-time player locations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditingUrl ? (
            <form onSubmit={handleSaveUrl} className="flex gap-1.5">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="http://..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingUrl(false)}
                className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsEditingUrl(true)}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl transition cursor-pointer"
            >
              Config URL
            </button>
          )}

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open in New Tab</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Embed Frame */}
      <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl relative">
        <iframe
          src={currentUrl}
          title="Minecraft Dynmap"
          className="w-full h-full border-0"
          allow="fullscreen"
        />
      </div>
    </div>
  );
}
