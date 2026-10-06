import "server-only";
import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { config } from "@/server/config";
import { triggerBackup } from "@/server/services/backup";

const execAsync = promisify(exec);

export interface ImportWorldResult {
  success: boolean;
  message?: string;
  backupOutput?: string;
  error?: string;
}

/**
 * Reads server.properties to determine the active level-name (world folder).
 * Defaults to "world".
 */
export async function getActiveLevelName(): Promise<string> {
  try {
    const propsPath = path.join(config.paths.data, "server.properties");
    const content = await fs.readFile(propsPath, "utf-8");
    const match = content.match(/^level-name\s*=\s*(.+)$/m);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  } catch {
    // If not found, standard default is 'world'
  }
  return "world";
}

/**
 * Imports a world from a .zip or .tar.gz archive buffer:
 * 1. Automatically creates a backup snapshot of current world
 * 2. Unpacks archive into temporary directory
 * 3. Identifies the directory containing `level.dat`
 * 4. Replaces or writes to the target world folder
 */
export async function importWorldArchive(
  fileName: string,
  buffer: Buffer
): Promise<ImportWorldResult> {
  const isZip = fileName.endsWith(".zip");
  const isTar = fileName.endsWith(".tar.gz") || fileName.endsWith(".tgz");

  if (!isZip && !isTar) {
    return { success: false, error: "Only .zip and .tar.gz world archives are supported" };
  }

  // 1. Take safety backup first
  let backupMsg = "";
  try {
    const backupRes = await triggerBackup();
    if (backupRes.success) {
      backupMsg = backupRes.output || "Safety backup created";
    }
  } catch (err) {
    console.warn("Safety backup before import failed:", err);
  }

  const tempDir = path.join(config.paths.data, `.import_temp_${Date.now()}`);
  const archivePath = path.join(tempDir, fileName);

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(archivePath, buffer);

    // 2. Extract into tempDir
    if (isZip) {
      // Use unzip command or bun/python/tar
      await execAsync(`unzip -q -o "${archivePath}" -d "${tempDir}/extracted"`, { timeout: 300000 });
    } else {
      await fs.mkdir(path.join(tempDir, "extracted"), { recursive: true });
      await execAsync(`tar -xzf "${archivePath}" -C "${tempDir}/extracted"`, { timeout: 300000 });
    }

    const extractedDir = path.join(tempDir, "extracted");

    // 3. Find directory with level.dat
    const findLevelDatDir = async (dir: string): Promise<string | null> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isFile() && entry.name === "level.dat") {
          return dir;
        }
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const sub = await findLevelDatDir(path.join(dir, entry.name));
          if (sub) return sub;
        }
      }
      return null;
    };

    const worldSourceDir = await findLevelDatDir(extractedDir);
    if (!worldSourceDir) {
      return {
        success: false,
        error: "Invalid world archive: missing 'level.dat' in archive structure",
      };
    }

    // 4. Overwrite active world directory
    const levelName = await getActiveLevelName();
    const targetWorldDir = path.join(config.paths.data, levelName);

    // Remove old world directory if exists
    try {
      await fs.rm(targetWorldDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }

    // Copy new world contents
    await fs.mkdir(targetWorldDir, { recursive: true });
    await execAsync(`cp -r "${worldSourceDir}/." "${targetWorldDir}/"`);

    return {
      success: true,
      message: `World imported into '${levelName}'. Restart server to load the new map.`,
      backupOutput: backupMsg,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to import world";
    return { success: false, error: msg };
  } finally {
    // Clean up temporary files
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  }
}
