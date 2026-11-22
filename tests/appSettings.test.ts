import { describe, expect, it } from "bun:test";
import {
  getAppSettings,
  saveAppSettings,
  getServerProperties,
  saveServerProperties,
} from "@/server/settings";

describe("app settings service", () => {
  it("loads default settings structure", async () => {
    const settings = await getAppSettings();
    expect(typeof settings.rconHost).toBe("string");
    expect(typeof settings.rconPort).toBe("number");
    expect(typeof settings.rconTimeoutMs).toBe("number");
    expect(typeof settings.mapUrl).toBe("string");
  });

  it("saves and patches settings", async () => {
    const updated = await saveAppSettings({ rconPort: 25576 });
    expect(updated.rconPort).toBe(25576);

    const reloaded = await getAppSettings();
    expect(reloaded.rconPort).toBe(25576);

    // Revert
    await saveAppSettings({ rconPort: 25575 });
  });

  it("loads server.properties key-value map", async () => {
    const props = await getServerProperties();
    expect(typeof props).toBe("object");
    expect(props["server-port"]).toBeDefined();
    expect(props["difficulty"]).toBeDefined();
  });

  it("updates and persists server.properties patches", async () => {
    const original = await getServerProperties();
    const origPort = original["server-port"] || "25565";

    const updated = await saveServerProperties({ "server-port": "25566" });
    expect(updated["server-port"]).toBe("25566");

    // Revert
    await saveServerProperties({ "server-port": origPort });
  });
});
