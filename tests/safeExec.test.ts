import { describe, expect, it } from "bun:test";
import fsSync from "fs";
import os from "os";
import { runCommand } from "@/server/core/exec";

const posixIt = process.platform === "win32" ? it.skip : it;

describe("runCommand", () => {
  posixIt("treats shell metacharacters as literal argv data", async () => {
    const r = await runCommand("printf", ["%s", "a;b $(id) `id`"]);
    expect(r.stdout).toBe("a;b $(id) `id`");
  });
  posixIt("rejects on non-zero exit", async () => {
    await expect(runCommand("false", [])).rejects.toBeTruthy();
  });
  posixIt("honours cwd", async () => {
    const r = await runCommand("pwd", [], { cwd: os.tmpdir() });
    expect(r.stdout.trim()).toBe(fsSync.realpathSync(os.tmpdir()));
  });
  posixIt("rejects on timeout", async () => {
    await expect(runCommand("sleep", ["5"], { timeoutMs: 100 })).rejects.toBeTruthy();
  });
});
