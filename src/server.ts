import { join } from "path";
import { config } from "./config.ts";
import {
  handleGetInfo,
  handleGetStatus,
  handleGetWhitelist,
  handlePostCommand,
  handlePostWhitelist,
} from "./routes/api.ts";

const DIST_DIR = join(import.meta.dir, "..", "dist");

export function startServer() {
  const server = Bun.serve({
    port: config.http.port,
    async fetch(req) {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // API routes
      if (pathname === "/api/status" && req.method === "GET") {
        return handleGetStatus();
      }

      if (pathname === "/api/info" && req.method === "GET") {
        return handleGetInfo();
      }

      if (pathname === "/api/whitelist") {
        if (req.method === "GET") return handleGetWhitelist();
        if (req.method === "POST") return handlePostWhitelist(req);
      }

      if (pathname === "/api/command" && req.method === "POST") {
        return handlePostCommand(req);
      }

      // Serve production Vite build
      const filePath = join(DIST_DIR, pathname === "/" ? "index.html" : pathname.slice(1));
      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }

      // SPA fallback
      const indexFallback = Bun.file(join(DIST_DIR, "index.html"));
      if (await indexFallback.exists()) {
        return new Response(indexFallback);
      }

      return new Response("Not Found", { status: 404 });
    },
  });

  console.log(`API Server listening on http://localhost:${server.port}`);
  return server;
}
