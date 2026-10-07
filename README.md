# Minecraft Admin Dashboard (`mc-admin`)

A modern, web-based management dashboard for Dockerized Minecraft servers. Built with **Next.js 16**, **React 19**, **Tailwind CSS**, and **RCON**.

---

## Why This Project Exists

Running a Minecraft server in Docker is standard practice, but everyday administration usually requires clunky workflows:
- Opening an SSH terminal just to run simple commands (`/op`, `/whitelist`, `/weather`).
- Digging through raw server logs to see who is online or what happened in chat.
- Manually writing shell scripts or cron jobs to tar/gz world folders and enforce retention.
- Dropping `.jar` files onto disk via SCP/FTP for mods and plugins.
- Heavyweight server panels (like Pterodactyl or Multicraft) that require complex daemon setups, databases, and multi-tier architectures.

**`mc-admin` solves this by acting as a single, lightweight web control panel** running alongside your server container. It connects directly via RCON and shared directory mounts to give you full control through an intuitive web UI without needing database servers or external daemon managers.

---

## Key Features

### 1. Real-Time Dashboard & Health
- Server status, player count, and RAM utilization at a glance.
- In-game weather and time state indicators.
- Player join/leave history parsed directly from server logs.

### 2. Player & Whitelist Management
- Live list of online players with current world coordinates and dimensions.
- Kick, ban, op/de-op, and teleport controls with one click.
- Full whitelist editor to add or revoke access without terminal access.

### 3. World & Environment Controls
- Instant time skipping (day, noon, night, midnight, custom ticks).
- Weather manipulation (clear, rain, thunder).
- Direct `.zip` world import to replace or update existing world saves safely.

### 4. Mod & Package Manager
- Browse and search mods directly from the [Modrinth API](https://modrinth.com/).
- One-click version download directly into the server's `mods` folder.
- Inspect and delete existing mod files from disk.

### 5. Automated Backups & One-Click Restore
- Trigger full world backups (`.tar.gz`) on demand.
- Configure retention limits to automatically prune older backups.
- Download backup archives directly in your browser.
- Restore from existing backups in-place.

### 6. Interactive RCON Console
- Direct command-line access to the Minecraft server with command history.
- Pre-populated quick buttons for common commands (`save-all`, `list`, `stop`).

### 7. In-Game Chat & Discord Bridge
- Live stream of server chat feed using Server-Sent Events (SSE).
- Send messages into the game directly from the dashboard.
- Optional Discord webhook and bot integration for bidirectional chat bridging and join/leave alerts.

### 8. Live Web Map Embedding
- Built-in frame view supporting Dynmap, BlueMap, or Squaremap hosted alongside your server.

### 9. Secure Access
- Session cookie authentication with scrypt password hashing.
- Settings panel to reconfigure RCON credentials, map URLs, and admin passwords at runtime.

---

## Architecture Overview

```
                      +-----------------------------+
                      |   Browser / Admin Client    |
                      +--------------+--------------+
                                     | HTTP :3000
                                     v
                      +-----------------------------+
                      |      mc-admin Container     |
                      |   (Next.js App + RCON)      |
                      +-------+--------------+------+
                              |              |
           RCON Protocol      |              | Shared Volumes
         (Port 25575)         |              | (/data, /backups)
                              v              v
     +---------------------------+    +-----------------------+
     |   mc-server Container     |    |   Host Filesystem     |
     |  (itzg/minecraft-server,  |    | - Minecraft data/logs |
     |   Forge, Fabric, Paper)   |    | - World backups       |
     +---------------------------+    +-----------------------+
```

---

## Getting Started

### Prerequisites
- Docker and Docker Compose installed on host machine.
- A running or planned Minecraft server container with **RCON enabled**.

---

### Step 1: Prepare Minecraft Server (`docker-compose.yml`)

The dashboard works seamlessly with standard images like `itzg/minecraft-server`. Ensure RCON is enabled:

```yaml
services:
  mc-server:
    image: itzg/minecraft-server:latest
    container_name: mc-server
    restart: unless-stopped
    ports:
      - "25565:25565"
      - "8123:8123" # Optional: Dynmap / BlueMap
    environment:
      EULA: "TRUE"
      VERSION: "1.20.1"
      TYPE: "FORGE" # Vanilla, PAPER, FABRIC, FORGE, etc.
      MEMORY: "8G"
      ENABLE_RCON: "true"
      RCON_PORT: "25575"
      RCON_PASSWORD: "change_this_to_a_secure_password"
    volumes:
      - ./data:/data
    networks:
      - minecraft_network

networks:
  minecraft_network:
    name: minecraft_default
```

---

### Step 2: Add Dashboard Service

Run the dashboard alongside your server on the same Docker network:

```yaml
services:
  mc-admin:
    image: ghcr.io/akhdanre/mc-admin:latest
    container_name: mc-admin
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - RCON_HOST=mc-server
      - RCON_PORT=25575
      - RCON_PASSWORD=change_this_to_a_secure_password
      - RCON_TIMEOUT_MS=5000
      - MC_DATA_PATH=/data
      - MC_BACKUPS_PATH=/backups
      - ADMIN_PASSWORD=admin123 # Initial dashboard password
      - NEXT_PUBLIC_MAP_URL=http://your-server-ip:8123 # Optional live map
    volumes:
      - ./data:/data:rw
      - ./backups:/backups:rw
    networks:
      - minecraft_network

networks:
  minecraft_network:
    name: minecraft_default
    external: true
```

Start the dashboard:
```bash
docker compose up -d
```

Open `http://<SERVER_IP>:3000` in your browser.
- Default username: none (single-admin password protected)
- Default password: `admin123` (or whatever set in `ADMIN_PASSWORD`)
- **Important:** Change the default password in **Settings** after initial login.

---

## Configuration Reference

| Environment Variable | Default | Description |
|---|---|---|
| `RCON_HOST` | `mc-server` | Hostname or IP of Minecraft RCON server |
| `RCON_PORT` | `25575` | RCON service port |
| `RCON_PASSWORD` | `""` | RCON authentication password |
| `RCON_TIMEOUT_MS` | `5000` | Timeout in milliseconds for RCON operations |
| `MC_DATA_PATH` | `/data` | Path to mounted Minecraft server directory |
| `MC_BACKUPS_PATH` | `/backups` | Path where backup archives are generated |
| `ADMIN_PASSWORD` | `admin123` | Initial admin dashboard password |
| `SESSION_SECRET` | auto-generated | Secret key for signing session tokens |
| `NEXT_PUBLIC_MAP_URL` | `http://localhost:8123` | Embed URL for Dynmap, BlueMap, or Squaremap |

---

## Local Development

Prerequisites: [Bun](https://bun.sh) (v1.2+)

```bash
# Clone the repository
git clone https://github.com/akhdanre/mc-dashboard.git
cd mc-dashboard

# Install dependencies
bun install

# Run development server
bun run dev

# Run unit and integration tests
bun test

# Typecheck and lint
bun run typecheck
bun run lint

# Build production bundle
bun run build
```

---

## License

MIT License. Feel free to use, modify, and distribute.
