import { describe, expect, it } from "bun:test";
import { parseFallbackFromFilename, extractJarMetadata } from "@/server/services/mods";

describe("mod service", () => {
  it("parses fallback name and version from filename conventions", () => {
    const res1 = parseFallbackFromFilename("jei-1.20.1-fabric-15.3.0.4.jar");
    expect(res1.name).toBe("jei");
    expect(res1.version).toBe("1.20.1-fabric-15.3.0.4");

    const res2 = parseFallbackFromFilename("fabric-api-0.92.0+1.20.1.jar.disabled");
    expect(res2.name).toBe("fabric api");
    expect(res2.version).toBe("0.92.0+1.20.1");

    const res3 = parseFallbackFromFilename("SimpleMod.jar");
    expect(res3.name).toBe("SimpleMod");
    expect(res3.version).toBeUndefined();
  });

  it("handles non-zip buffer gracefully", () => {
    const randomBuffer = Buffer.from("not a real jar file");
    const meta = extractJarMetadata(randomBuffer);
    expect(meta.loader).toBe("unknown");
  });
});
