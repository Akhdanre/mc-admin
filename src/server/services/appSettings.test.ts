import { describe, expect, it } from "bun:test";
import { getAppSettings, saveAppSettings } from "@/server/services/appSettings";

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
});
