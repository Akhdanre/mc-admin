import "server-only";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const ARCHIVE_EXEC_TIMEOUT_MS = 300_000;

/** Runs a binary with argv (never through a shell). Throws on non-zero exit/timeout. */
export async function runCommand(
  cmd: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number } = {}
): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync(cmd, args, {
    cwd: options.cwd,
    timeout: options.timeoutMs ?? ARCHIVE_EXEC_TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024,
  });
  return { stdout, stderr };
}
