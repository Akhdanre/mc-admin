import { Rcon } from "rcon-client";
import "dotenv/config";

const RCON_HOST = process.env.RCON_HOST || "192.168.137.158";
const RCON_PORT = Number(process.env.RCON_PORT) || 25575;
const RCON_PASSWORD = process.env.RCON_PASSWORD || "";
const HTTP_PORT = Number(process.env.PORT) || 3000;

interface PlayerStatus {
  onlineCount: number;
  maxCount: number;
  players: string[];
  raw: string;
  error?: string;
  updatedAt: string;
}

interface WhitelistStatus {
  players: string[];
  raw: string;
  error?: string;
  updatedAt: string;
}

async function executeRconCommand(command: string): Promise<string> {
  const rcon = await Rcon.connect({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD,
    timeout: 5000,
  });

  try {
    const response = await rcon.send(command);
    return response;
  } finally {
    await rcon.end();
  }
}

function parsePlayerList(raw: string): Omit<PlayerStatus, "updatedAt"> {
  // Typical output: "There are 0 of a max of 20 players online: "
  // Or: "There are 2 of a max of 20 players online: Alex, Steve"
  const match = raw.match(/There are (\d+) of a max of (\d+) players online:(.*)/i);
  if (!match) {
    return {
      onlineCount: 0,
      maxCount: 20,
      players: [],
      raw,
    };
  }

  const onlineCount = Number(match[1]);
  const maxCount = Number(match[2]);
  const playerNames = (match[3] ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    onlineCount,
    maxCount,
    players: playerNames,
    raw,
  };
}

function parseWhitelist(raw: string): string[] {
  // Vanilla/Paper typical formats:
  // "There are 2 whitelisted player(s): Steve, Alex"
  // "There are no whitelisted players"
  // "Whitelisted players: Steve, Alex"
  const match = raw.match(/whitelisted(?:\s+player\(?s?\)?)?:\s*(.*)/i);
  if (!match || !match[1]) {
    return [];
  }

  return match[1]
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}

async function getPlayerStatus(): Promise<PlayerStatus> {
  try {
    const raw = await executeRconCommand("list");
    const parsed = parsePlayerList(raw);
    return {
      ...parsed,
      updatedAt: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      onlineCount: 0,
      maxCount: 0,
      players: [],
      raw: "",
      error: errorMessage,
      updatedAt: new Date().toLocaleTimeString(),
    };
  }
}

async function getWhitelistStatus(): Promise<WhitelistStatus> {
  try {
    const raw = await executeRconCommand("whitelist list");
    const players = parseWhitelist(raw);
    return {
      players,
      raw,
      updatedAt: new Date().toLocaleTimeString(),
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      players: [],
      raw: "",
      error: errorMessage,
      updatedAt: new Date().toLocaleTimeString(),
    };
  }
}

function renderHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Minecraft Server Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="max-w-4xl mx-auto px-4 py-10">
    <!-- Header -->
    <header class="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
      <div>
        <div class="flex items-center gap-3">
          <span class="text-3xl">⛏️</span>
          <h1 class="text-2xl font-bold tracking-tight text-white">MC Server Dashboard</h1>
        </div>
        <p class="text-sm text-slate-400 mt-1">Live active players & whitelist access monitor</p>
      </div>
      <div id="statusBadge" class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Connected</span>
      </div>
    </header>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p class="text-xs font-medium uppercase text-slate-400">Online Players</p>
        <div class="flex items-baseline gap-2 mt-2">
          <span id="onlineCount" class="text-3xl font-extrabold text-white">0</span>
          <span class="text-sm text-slate-500">/ <span id="maxCount">0</span> max</span>
        </div>
      </div>
      <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p class="text-xs font-medium uppercase text-slate-400">Whitelisted Users</p>
        <div class="flex items-baseline gap-2 mt-2">
          <span id="whitelistCount" class="text-3xl font-extrabold text-indigo-400">0</span>
          <span class="text-sm text-slate-500">total</span>
        </div>
      </div>
      <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p class="text-xs font-medium uppercase text-slate-400">Target Server</p>
        <p class="text-base font-semibold text-white mt-2 font-mono">${RCON_HOST}</p>
        <p class="text-xs text-slate-500">Port ${RCON_PORT}</p>
      </div>
      <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <p class="text-xs font-medium uppercase text-slate-400">Last Synced</p>
        <p id="updatedAt" class="text-base font-semibold text-white mt-2">-</p>
        <p class="text-xs text-slate-500">Auto refresh every 4s</p>
      </div>
    </div>

    <!-- Active Players Section -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-white flex items-center gap-2">
          <span>Active Players</span>
        </h2>
        <button id="btnRefresh" onclick="fetchStatus()" class="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700">
          Sync Now
        </button>
      </div>

      <div id="playerList" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"></div>

      <div id="emptyPlayers" class="hidden text-center py-10 border border-dashed border-slate-800 rounded-lg">
        <p class="text-slate-400 text-sm">No players currently online in the server.</p>
      </div>
    </div>

    <!-- Whitelist Management Section -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6 mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h2 class="text-lg font-bold text-white flex items-center gap-2">
            <span>Whitelist Access Management</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Control player access and grant entry to whitelisted users.</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button onclick="toggleWhitelist('on')" class="px-3 py-1.5 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-lg transition border border-emerald-500/30 font-medium">
            Turn On
          </button>
          <button onclick="toggleWhitelist('off')" class="px-3 py-1.5 text-xs bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded-lg transition border border-rose-500/30 font-medium">
            Turn Off
          </button>
          <button onclick="reloadWhitelist()" class="px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition border border-slate-700 font-medium">
            Reload
          </button>
        </div>
      </div>

      <!-- Add User Form -->
      <form id="whitelistAddForm" onsubmit="addWhitelistUser(event)" class="flex gap-2 mb-6">
        <input 
          id="whitelistUserInput" 
          type="text" 
          maxlength="16"
          placeholder="Minecraft username (e.g. Notch, Steve)" 
          class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
        />
        <button type="submit" class="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5">
          <span>+ Add to Whitelist</span>
        </button>
      </form>

      <!-- Whitelist Notification / Action Feedback -->
      <div id="whitelistFeedback" class="hidden mb-4 p-3 rounded-lg text-xs font-mono border"></div>

      <!-- Whitelisted Users Grid -->
      <div id="whitelistList" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"></div>

      <div id="emptyWhitelist" class="hidden text-center py-10 border border-dashed border-slate-800 rounded-lg">
        <p class="text-slate-400 text-sm">No players currently in whitelist.</p>
      </div>
    </div>

    <!-- Quick RCON Command Execution -->
    <div class="bg-slate-900/60 border border-slate-800/80 rounded-xl p-6">
      <h2 class="text-lg font-bold text-white mb-2">Execute RCON Command</h2>
      <p class="text-xs text-slate-400 mb-4">Send Minecraft commands directly to the server (e.g. <code>list</code>, <code>say hello</code>, <code>time query day</code>).</p>
      
      <form id="cmdForm" onsubmit="sendCommand(event)" class="flex gap-2 mb-4">
        <input 
          id="cmdInput" 
          type="text" 
          placeholder="e.g. list" 
          class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
        />
        <button type="submit" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition">
          Run
        </button>
      </form>

      <div class="bg-slate-950 rounded-lg p-3 border border-slate-800/60 font-mono text-xs text-slate-300 min-h-[70px] overflow-x-auto whitespace-pre-wrap" id="cmdOutput">Awaiting command...</div>
    </div>
  </div>

  <script>
    function showFeedback(message, isError = false) {
      const fb = document.getElementById('whitelistFeedback');
      fb.classList.remove('hidden', 'bg-rose-500/10', 'border-rose-500/20', 'text-rose-400', 'bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
      if (isError) {
        fb.classList.add('bg-rose-500/10', 'border-rose-500/20', 'text-rose-400');
      } else {
        fb.classList.add('bg-emerald-500/10', 'border-emerald-500/20', 'text-emerald-400');
      }
      fb.textContent = message;
      setTimeout(() => {
        fb.classList.add('hidden');
      }, 5000);
    }

    async function fetchStatus() {
      try {
        const [statusRes, whitelistRes] = await Promise.all([
          fetch('/api/status'),
          fetch('/api/whitelist')
        ]);
        const data = await statusRes.json();
        const whitelistData = await whitelistRes.json();
        
        const badge = document.getElementById('statusBadge');
        const count = document.getElementById('onlineCount');
        const max = document.getElementById('maxCount');
        const updated = document.getElementById('updatedAt');
        const playerList = document.getElementById('playerList');
        const empty = document.getElementById('emptyPlayers');

        if (data.error) {
          badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-400"></span><span>Disconnected</span>';
          count.textContent = '0';
          max.textContent = '0';
          updated.textContent = data.updatedAt;
          playerList.innerHTML = '';
          empty.classList.remove('hidden');
          empty.innerHTML = '<p class="text-rose-400 text-sm">Failed to connect: ' + data.error + '</p>';
        } else {
          badge.className = 'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span><span>Connected</span>';

          count.textContent = data.onlineCount;
          max.textContent = data.maxCount;
          updated.textContent = data.updatedAt;

          playerList.innerHTML = '';
          if (data.players.length === 0) {
            empty.classList.remove('hidden');
            empty.innerHTML = '<p class="text-slate-400 text-sm">No players currently online in the server.</p>';
          } else {
            empty.classList.add('hidden');
            data.players.forEach(name => {
              const card = document.createElement('div');
              card.className = 'flex items-center gap-3 p-3 bg-slate-950/80 border border-slate-800 rounded-lg hover:border-slate-700 transition';
              card.innerHTML = \`
                <img src="https://mc-heads.net/avatar/\${name}/36" alt="\${name}" class="w-9 h-9 rounded-md bg-slate-800" onerror="this.src='https://mc-heads.net/avatar/Steve/36'"/>
                <div>
                  <p class="text-sm font-semibold text-white">\${name}</p>
                  <p class="text-xs text-emerald-400 font-medium">In Game</p>
                </div>
              \`;
              playerList.appendChild(card);
            });
          }
        }

        renderWhitelist(whitelistData);
      } catch (e) {
        console.error(e);
      }
    }

    function renderWhitelist(data) {
      const whitelistCount = document.getElementById('whitelistCount');
      const listContainer = document.getElementById('whitelistList');
      const emptyWhitelist = document.getElementById('emptyWhitelist');

      if (!data || data.error) {
        whitelistCount.textContent = '0';
        listContainer.innerHTML = '';
        emptyWhitelist.classList.remove('hidden');
        emptyWhitelist.innerHTML = '<p class="text-rose-400 text-sm">' + (data?.error || 'Failed to fetch whitelist') + '</p>';
        return;
      }

      const players = data.players || [];
      whitelistCount.textContent = players.length;
      listContainer.innerHTML = '';

      if (players.length === 0) {
        emptyWhitelist.classList.remove('hidden');
        emptyWhitelist.innerHTML = '<p class="text-slate-400 text-sm">No players currently in whitelist.</p>';
      } else {
        emptyWhitelist.classList.add('hidden');
        players.forEach(name => {
          const card = document.createElement('div');
          card.className = 'flex items-center justify-between p-3 bg-slate-950/80 border border-slate-800 rounded-lg hover:border-slate-700 transition';
          card.innerHTML = \`
            <div class="flex items-center gap-3">
              <img src="https://mc-heads.net/avatar/\${name}/36" alt="\${name}" class="w-9 h-9 rounded-md bg-slate-800" onerror="this.src='https://mc-heads.net/avatar/Steve/36'"/>
              <div>
                <p class="text-sm font-semibold text-white">\${name}</p>
                <p class="text-xs text-indigo-400 font-medium">Whitelisted</p>
              </div>
            </div>
            <button onclick="removeWhitelistUser('\${name}')" title="Remove user" class="p-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded transition border border-transparent hover:border-rose-500/20">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          \`;
          listContainer.appendChild(card);
        });
      }
    }

    async function addWhitelistUser(e) {
      e.preventDefault();
      const input = document.getElementById('whitelistUserInput');
      const username = input.value.trim();
      if (!username) return;

      try {
        const res = await fetch('/api/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', username })
        });
        const data = await res.json();
        if (data.error) {
          showFeedback('Error: ' + data.error, true);
        } else {
          showFeedback(data.result || ('Added ' + username + ' to whitelist'));
          input.value = '';
          if (data.status) renderWhitelist(data.status);
        }
      } catch (err) {
        showFeedback('Error: ' + err.message, true);
      }
    }

    async function removeWhitelistUser(username) {
      if (!confirm(\`Remove \${username} from whitelist?\`)) return;

      try {
        const res = await fetch('/api/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', username })
        });
        const data = await res.json();
        if (data.error) {
          showFeedback('Error: ' + data.error, true);
        } else {
          showFeedback(data.result || ('Removed ' + username + ' from whitelist'));
          if (data.status) renderWhitelist(data.status);
        }
      } catch (err) {
        showFeedback('Error: ' + err.message, true);
      }
    }

    async function toggleWhitelist(mode) {
      try {
        const res = await fetch('/api/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: mode })
        });
        const data = await res.json();
        if (data.error) {
          showFeedback('Error: ' + data.error, true);
        } else {
          showFeedback(data.result || (\`Whitelist turned \${mode}\`));
        }
      } catch (err) {
        showFeedback('Error: ' + err.message, true);
      }
    }

    async function reloadWhitelist() {
      try {
        const res = await fetch('/api/whitelist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reload' })
        });
        const data = await res.json();
        if (data.error) {
          showFeedback('Error: ' + data.error, true);
        } else {
          showFeedback(data.result || 'Whitelist reloaded');
          if (data.status) renderWhitelist(data.status);
        }
      } catch (err) {
        showFeedback('Error: ' + err.message, true);
      }
    }

    async function sendCommand(e) {
      e.preventDefault();
      const input = document.getElementById('cmdInput');
      const output = document.getElementById('cmdOutput');
      const cmd = input.value.trim();
      if (!cmd) return;

      output.textContent = 'Executing "' + cmd + '"...';
      try {
        const res = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: cmd })
        });
        const data = await res.json();
        output.textContent = data.result || data.error;
        input.value = '';
        fetchStatus();
      } catch (err) {
        output.textContent = 'Error: ' + err.message;
      }
    }

    fetchStatus();
    setInterval(fetchStatus, 4000);
  </script>
</body>
</html>`;
}

Bun.serve({
  port: HTTP_PORT,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/") {
      return new Response(renderHtml(), {
        headers: { "Content-Type": "text/html" },
      });
    }

    if (url.pathname === "/api/status") {
      const status = await getPlayerStatus();
      return Response.json(status);
    }

    if (url.pathname === "/api/whitelist" && req.method === "GET") {
      const status = await getWhitelistStatus();
      return Response.json(status);
    }

    if (url.pathname === "/api/whitelist" && req.method === "POST") {
      try {
        const body = (await req.json()) as {
          action?: "add" | "remove" | "reload" | "on" | "off";
          username?: string;
        };

        const action = body.action;
        if (!action || !["add", "remove", "reload", "on", "off"].includes(action)) {
          return Response.json(
            { error: "Invalid action. Supported: add, remove, reload, on, off" },
            { status: 400 }
          );
        }

        let command = `whitelist ${action}`;
        if (action === "add" || action === "remove") {
          const cleanUser = body.username?.trim() ?? "";
          if (!/^[a-zA-Z0-9_]{1,16}$/.test(cleanUser)) {
            return Response.json(
              { error: "Invalid username. Minecraft usernames must be 1-16 alphanumeric characters or underscores." },
              { status: 400 }
            );
          }
          command = `whitelist ${action} ${cleanUser}`;
        }

        const result = await executeRconCommand(command);
        const status = await getWhitelistStatus();
        return Response.json({ result, status });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return Response.json({ error: errorMessage }, { status: 500 });
      }
    }

    if (url.pathname === "/api/command" && req.method === "POST") {
      try {
        const body = (await req.json()) as { command?: string };
        if (!body.command) {
          return Response.json({ error: "Command required" }, { status: 400 });
        }
        const result = await executeRconCommand(body.command);
        return Response.json({ result });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return Response.json({ error: errorMessage }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server listening on http://localhost:${HTTP_PORT}`);
