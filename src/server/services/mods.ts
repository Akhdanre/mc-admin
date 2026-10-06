import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { config } from "@/server/config";
import type { ModInfo } from "@/types";
const modsDir = path.join(config.paths.data, "mods");
export interface JarMetadata {
  id?: string;
  name?: string;
  version?: string;
  description?: string;
  loader?: "fabric" | "forge" | "neoforge" | "quilt" | "unknown";
}

/**
 * Minimal ZIP archive reader using standard library buffer operations.
 * Reads central directory entries and extracts uncompressed/deflated metadata files.
 */
export function extractJarMetadata(buffer: Buffer): JarMetadata {
  try {
    // Find End of Central Directory (EOCD) signature: 0x06054b50
    let eocdOffset = -1;
    for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
      if (buffer.readUInt32LE(i) === 0x06054b50) {
        eocdOffset = i;
        break;
      }
    }

    if (eocdOffset === -1) {
      return { loader: "unknown" };
    }

    const cdEntries = buffer.readUInt16LE(eocdOffset + 10);
    let cdOffset = buffer.readUInt32LE(eocdOffset + 16);

    let fabricJsonContent: string | null = null;
    let modsTomlContent: string | null = null;
    let mcmodInfoContent: string | null = null;

    for (let i = 0; i < cdEntries; i++) {
      if (cdOffset + 46 > buffer.length) break;
      if (buffer.readUInt32LE(cdOffset) !== 0x02014b50) break;

      const compressionMethod = buffer.readUInt16LE(cdOffset + 10);
      const compressedSize = buffer.readUInt32LE(cdOffset + 20);
      const fileNameLength = buffer.readUInt16LE(cdOffset + 28);
      const extraFieldLength = buffer.readUInt16LE(cdOffset + 30);
      const fileCommentLength = buffer.readUInt16LE(cdOffset + 32);
      const localHeaderOffset = buffer.readUInt32LE(cdOffset + 42);

      const fileName = buffer.toString("utf8", cdOffset + 46, cdOffset + 46 + fileNameLength);

      const isFabric = fileName === "fabric.mod.json";
      const isModsToml = fileName === "META-INF/mods.toml";
      const isMcModInfo = fileName === "mcmod.info";

      if ((isFabric || isModsToml || isMcModInfo) && localHeaderOffset + 30 <= buffer.length) {
        const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
        const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
        const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;

        if (dataOffset + compressedSize <= buffer.length) {
          const rawSlice = buffer.subarray(dataOffset, dataOffset + compressedSize);
          let decompressed: Buffer | null = null;

          if (compressionMethod === 0) {
            decompressed = rawSlice;
          } else if (compressionMethod === 8) {
            try {
              decompressed = zlib.inflateRawSync(rawSlice);
            } catch {
              decompressed = null;
            }
          }

          if (decompressed) {
            const str = decompressed.toString("utf8");
            if (isFabric) fabricJsonContent = str;
            else if (isModsToml) modsTomlContent = str;
            else if (isMcModInfo) mcmodInfoContent = str;
          }
        }
      }

      cdOffset += 46 + fileNameLength + extraFieldLength + fileCommentLength;
    }

    if (fabricJsonContent) {
      try {
        const parsed = JSON.parse(fabricJsonContent);
        return {
          id: parsed.id,
          name: parsed.name || parsed.id,
          version: parsed.version,
          description: parsed.description,
          loader: "fabric",
        };
      } catch {
        // Fallback
      }
    }

    if (modsTomlContent) {
      const modIdMatch = modsTomlContent.match(/modId\s*=\s*["']([^"']+)["']/i);
      const displayNameMatch = modsTomlContent.match(/displayName\s*=\s*["']([^"']+)["']/i);
      const versionMatch = modsTomlContent.match(/version\s*=\s*["']([^"']+)["']/i);
      const descMatch = modsTomlContent.match(/description\s*=\s*'''([\s\S]*?)'''|description\s*=\s*"""([\s\S]*?)"""|description\s*=\s*["']([^"']+)["']/i);

      return {
        id: modIdMatch ? modIdMatch[1] : undefined,
        name: displayNameMatch ? displayNameMatch[1] : modIdMatch?.[1],
        version: versionMatch ? versionMatch[1] : undefined,
        description: descMatch ? (descMatch[1] || descMatch[2] || descMatch[3] || "").trim() : undefined,
        loader: "forge",
      };
    }

    if (mcmodInfoContent) {
      try {
        const parsed = JSON.parse(mcmodInfoContent);
        const first = Array.isArray(parsed) ? parsed[0] : parsed?.modList?.[0];
        if (first) {
          return {
            id: first.modid,
            name: first.name || first.modid,
            version: first.version,
            description: first.description,
            loader: "forge",
          };
        }
      } catch {
        // Fallback
      }
    }
  } catch {
    // If ZIP parsing fails, fallback cleanly
  }

  return { loader: "unknown" };
}

/**
 * Format fallback name and version from a filename like "jei-1.20.1-fabric-15.3.0.4.jar"
 */
export function parseFallbackFromFilename(fileName: string): { name: string; version?: string } {
  const clean = fileName.replace(/\.jar(\.disabled)?$/i, "");
  const parts = clean.split(/[-_](?=\d)/);
  if (parts.length > 1) {
    return {
      name: parts[0].replace(/[-_]/g, " "),
      version: parts.slice(1).join("-"),
    };
  }
  return { name: clean };
}

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
