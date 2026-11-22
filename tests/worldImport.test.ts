import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import fs from "fs/promises";
import os from "os";
import path from "path";

// Dynamic imports are required here: `mock.module` must be registered before any
// `@/server/...` module loads, and `config` is captured at module load time.

let dataDir = "";
let backupsDir = "";

beforeAll(async () => {
  dataDir = await fs.mkdtemp(path.join(os.tmpdir(), "mc-world-data-"));
  backupsDir = await fs.mkdtemp(path.join(os.tmpdir(), "mc-world-backups-"));
  mock.module("@/server/core", () => ({
    config: { paths: { data: dataDir, backups: backupsDir } },
    runCommand: async () => ({ stdout: "", stderr: "" }),
  }));
  mock.module("@/server/backup", () => ({
    triggerBackup: async () => ({ success: false }),
  }));
});

afterAll(async () => {
  mock.restore();
  await fs.rm(dataDir, { recursive: true, force: true });
  await fs.rm(backupsDir, { recursive: true, force: true });
});

describe("world import service", () => {
  it("resolves default level name when server.properties is missing", async () => {
    const { getActiveLevelName } = await import("@/server/world");
    expect(await getActiveLevelName()).toBe("world");
  });

  it("rejects path traversal in level-name and falls back to world", async () => {
    await fs.writeFile(path.join(dataDir, "server.properties"), "level-name=../evil\n");
    const { getActiveLevelName } = await import("@/server/world");
    expect(await getActiveLevelName()).toBe("world");
  });

  it("accepts a safe custom level-name", async () => {
    await fs.writeFile(path.join(dataDir, "server.properties"), "level-name=world_nether\n");
    const { getActiveLevelName } = await import("@/server/world");
    expect(await getActiveLevelName()).toBe("world_nether");
  });

  it("does not execute shell metacharacters from the archive filename", async () => {
    const { importWorldArchive } = await import("@/server/world");
    const res = await importWorldArchive('x";touch pwned;".zip', Buffer.from("not a zip"));
    expect(res.success).toBe(false);
    expect(await fs.readdir("/tmp").then((e) => e.includes("pwned"))).toBe(false);
    await expect(fs.access(path.join(dataDir, "pwned"))).rejects.toBeTruthy();
  });

  it("refuses traversal in level-name before touching the filesystem", async () => {
    await fs.writeFile(path.join(dataDir, "server.properties"), "level-name=../escape\n");
    const { importWorldArchive } = await import("@/server/world");
    const res = await importWorldArchive("safe.tar.gz", Buffer.from("not a tar"));
    expect(res.success).toBe(false);
    await expect(fs.access(path.join(dataDir, "..", "escape"))).rejects.toBeTruthy();
  });
});
