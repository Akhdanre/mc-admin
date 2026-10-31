import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { config } from "@/server/core";
import { extractJarMetadata, parseFallbackFromFilename, type JarMetadata } from "./parse";
import type { ModInfo } from "@/types";

const modsDir = path.join(config.paths.data, "mods");

interface ModCacheEntry {
  mtimeMs: number;
  sizeBytes: number;
  metadata: JarMetadata;
}

const modMetadataCache = new Map<string, ModCacheEntry>();
const MAX_JAR_PARSE_BYTES = 8 * 1024 * 1024; // 8 MB

export async function listInstalledMods(): Promise<ModInfo[]> {
  try {
    await fs.mkdir(modsDir, { recursive: true }).catch(() => {});
    let dirEntries;
    try {
      dirEntries = await fs.readdir(modsDir, { withFileTypes: true });
    } catch {
      return [];
    }

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
      const cached = modMetadataCache.get(fileName);

      if (cached && cached.mtimeMs === stat.mtimeMs && cached.sizeBytes === stat.size) {
        metadata = cached.metadata;
      } else {
        if (stat.size <= MAX_JAR_PARSE_BYTES) {
          try {
            const fileBuf = await fs.readFile(filePath);
            metadata = extractJarMetadata(fileBuf);
          } catch {
            // Fallback
          }
        } else {
          // Large jar (> 8MB): assume forge/loader from filename without streaming 100MB+ over network
          metadata = {
            loader: fileName.toLowerCase().includes("forge") ? "forge" : "unknown",
          };
        }
        modMetadataCache.set(fileName, {
          mtimeMs: stat.mtimeMs,
          sizeBytes: stat.size,
          metadata,
        });
      }

      const fallback = parseFallbackFromFilename(fileName);

      mods.push({
        fileName,
        name: metadata.name || fallback.name,
        id: metadata.id || fallback.name.toLowerCase().replace(/[^a-z0-9_-]/g, ""),
        version:
          metadata.version && !metadata.version.includes("[") && !metadata.version.includes("${")
            ? metadata.version
            : fallback.version || "1.0.0",
        description: metadata.description || `Forge extension: ${fileName}`,
        loader: metadata.loader || "forge",
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

export async function toggleMod(
  fileName: string,
  enable: boolean
): Promise<{ success: boolean; newFileName: string }> {
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

  modMetadataCache.delete(safeName);
  modMetadataCache.delete(newName);

  return { success: true, newFileName: newName };
}

export async function deleteMod(fileName: string): Promise<boolean> {
  const safeName = path.basename(fileName);
  await fs.unlink(path.join(modsDir, safeName));
  modMetadataCache.delete(safeName);
  return true;
}

export async function saveModFile(fileName: string, buffer: Buffer): Promise<string> {
  await fs.mkdir(modsDir, { recursive: true });
  const safeName = path.basename(fileName).replace(/[^a-zA-Z0-9._\-+]/g, "_");
  if (!safeName.endsWith(".jar")) {
    throw new Error("Only .jar files are allowed");
  }

  await fs.writeFile(path.join(modsDir, safeName), buffer);
  modMetadataCache.delete(safeName);
  return safeName;
}
