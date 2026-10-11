import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "@/server/config";
import {
  extractJarMetadata,
  parseFallbackFromFilename,
  type JarMetadata,
} from "@/server/domain/parse/mods";
import type { ModInfo } from "@/types";

const modsDir = path.join(config.paths.data, "mods");

export async function listInstalledMods(): Promise<ModInfo[]> {
  try {
    await fs.mkdir(modsDir, { recursive: true });
    const dirEntries = await fs.readdir(modsDir, { withFileTypes: true });

    const mods: ModInfo[] = [];

    for (const entry of dirEntries) {
      if (!entry.isFile()) continue;
      const fileName = entry.name;
      const isJar = fileName.endsWith(".jar");
      const isDisabled = fileName.endsWith(".jar.disabled");

      if (!isJar && !isDisabled) continue;

      const filePath = path.join(modsDir, fileName);
      const stat = await fs.stat(filePath);

      let metadata: JarMetadata = { loader: "unknown" };
      try {
        const fileBuf = await fs.readFile(filePath);
        metadata = extractJarMetadata(fileBuf);
      } catch {
        // Fallback
      }

      const fallback = parseFallbackFromFilename(fileName);

      mods.push({
        fileName,
        name: metadata.name || fallback.name,
        id: metadata.id,
        version: metadata.version || fallback.version,
        description: metadata.description,
        loader: metadata.loader,
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        enabled: !isDisabled,
      });
    }

    return mods.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("[ModService] Failed to read mods directory:", error);
    return [];
  }
}

export async function toggleMod(fileName: string, enable: boolean): Promise<{ success: boolean; newFileName: string }> {
  const safeName = path.basename(fileName);
  const currentPath = path.join(modsDir, safeName);
  await fs.access(currentPath);

  const newName = enable
    ? safeName.replace(/\.jar\.disabled$/i, ".jar")
    : safeName.replace(/\.jar$/i, ".jar.disabled");

  if (newName === safeName) {
    return { success: true, newFileName: safeName };
  }

  const targetPath = path.join(modsDir, newName);
  await fs.rename(currentPath, targetPath);
  return { success: true, newFileName: newName };
}

export async function deleteMod(fileName: string): Promise<boolean> {
  const safeName = path.basename(fileName);
  await fs.unlink(path.join(modsDir, safeName));
  return true;
}

export async function saveModFile(fileName: string, buffer: Buffer): Promise<string> {
  await fs.mkdir(modsDir, { recursive: true });
  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._\-+]/g, "_");
  if (!safeName.endsWith(".jar")) {
    throw new Error("Only .jar files are allowed");
  }

  await fs.writeFile(path.join(modsDir, safeName), buffer);
  return safeName;
}
