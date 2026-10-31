export interface MockInventoryItem {
  id: string;
  name: string;
  count: number;
  slot: number; // 0-26 main, 27-35 hotbar, 36-39 armor, 40 offhand
  icon?: string;
  durability?: { current: number; max: number };
  lore?: string[];
}

export interface MockPlayerDetail {
  username: string;
  uuid: string;
  dimension: "overworld" | "the_nether" | "the_end";
  x: number;
  y: number;
  z: number;
  ping: number;
  role: "admin" | "moderator" | "vip" | "member";
  gamemode: "survival" | "creative" | "spectator";
  health: number; // 0-20
  food: number; // 0-20
  xpLevel: number;
  onlineDuration: string;
  inventory: MockInventoryItem[];
}

export const MOCK_PLAYERS: MockPlayerDetail[] = [
  {
    username: "_xKaelin",
    uuid: "9f8b1c4a-6d2e-4b8a-9f1e-2c3d4e5f6a7b",
    dimension: "overworld",
    x: 124.5,
    y: 72.0,
    z: -340.2,
    ping: 28,
    role: "admin",
    gamemode: "survival",
    health: 20,
    food: 20,
    xpLevel: 68,
    onlineDuration: "3h 42m",
    inventory: [
      {
        id: "netherite_sword",
        name: "Netherite Sword",
        count: 1,
        slot: 27,
        durability: { current: 1980, max: 2031 },
        lore: ["Sharpness V", "Mending", "Unbreaking III"],
      },
      {
        id: "netherite_pickaxe",
        name: "Netherite Pickaxe",
        count: 1,
        slot: 28,
        durability: { current: 1850, max: 2031 },
        lore: ["Efficiency V", "Fortune III", "Mending"],
      },
      { id: "golden_apple", name: "Enchanted Golden Apple", count: 8, slot: 29 },
      { id: "cooked_beef", name: "Steak", count: 64, slot: 30 },
      { id: "ender_pearl", name: "Ender Pearl", count: 16, slot: 31 },
      { id: "firework_rocket", name: "Firework Rocket", count: 64, slot: 32 },
      { id: "totem_of_undying", name: "Totem of Undying", count: 1, slot: 40 }, // offhand
      {
        id: "netherite_helmet",
        name: "Netherite Helmet",
        count: 1,
        slot: 39,
        durability: { current: 390, max: 407 },
      },
      { id: "elytra", name: "Elytra", count: 1, slot: 38, durability: { current: 410, max: 432 } },
      {
        id: "netherite_leggings",
        name: "Netherite Leggings",
        count: 1,
        slot: 37,
        durability: { current: 520, max: 555 },
      },
      {
        id: "netherite_boots",
        name: "Netherite Boots",
        count: 1,
        slot: 36,
        durability: { current: 460, max: 481 },
      },
      { id: "diamond_block", name: "Block of Diamond", count: 12, slot: 0 },
      { id: "shulker_box", name: "Black Shulker Box", count: 1, slot: 1 },
      { id: "experience_bottle", name: "Bottle o' Enchanting", count: 64, slot: 2 },
      { id: "oak_log", name: "Oak Log", count: 64, slot: 3 },
      { id: "iron_ingot", name: "Iron Ingot", count: 48, slot: 4 },
    ],
  },
  {
    username: "notch_fan_99",
    uuid: "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
    dimension: "the_nether",
    x: -840.1,
    y: 56.0,
    z: 210.8,
    ping: 45,
    role: "vip",
    gamemode: "survival",
    health: 18,
    food: 16,
    xpLevel: 34,
    onlineDuration: "1h 15m",
    inventory: [
      {
        id: "diamond_pickaxe",
        name: "Diamond Pickaxe",
        count: 1,
        slot: 27,
        durability: { current: 1200, max: 1561 },
      },
      {
        id: "diamond_sword",
        name: "Diamond Sword",
        count: 1,
        slot: 28,
        durability: { current: 1400, max: 1561 },
      },
      { id: "cooked_porkchop", name: "Cooked Porkchop", count: 32, slot: 29 },
      { id: "cobblestone", name: "Cobblestone", count: 64, slot: 30 },
      { id: "diamond_chestplate", name: "Diamond Chestplate", count: 1, slot: 38 },
      { id: "shield", name: "Shield", count: 1, slot: 40 },
    ],
  },
  {
    username: "DiamondPick42",
    uuid: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    dimension: "overworld",
    x: 45.2,
    y: 64.0,
    z: -12.4,
    ping: 32,
    role: "member",
    gamemode: "survival",
    health: 20,
    food: 20,
    xpLevel: 22,
    onlineDuration: "45m",
    inventory: [
      { id: "iron_pickaxe", name: "Iron Pickaxe", count: 1, slot: 27 },
      { id: "bread", name: "Bread", count: 24, slot: 28 },
      { id: "torch", name: "Torch", count: 64, slot: 29 },
    ],
  },
  {
    username: "EndermanSlayer",
    uuid: "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
    dimension: "the_end",
    x: 0.0,
    y: 62.0,
    z: 0.0,
    ping: 64,
    role: "vip",
    gamemode: "survival",
    health: 14,
    food: 18,
    xpLevel: 51,
    onlineDuration: "2h 08m",
    inventory: [
      { id: "netherite_sword", name: "Netherite Sword", count: 1, slot: 27 },
      { id: "bow", name: "Infinity Bow", count: 1, slot: 28 },
      { id: "ender_pearl", name: "Ender Pearl", count: 16, slot: 29 },
      { id: "arrow", name: "Arrow", count: 1, slot: 9 },
    ],
  },
  {
    username: "RedstoneMaster",
    uuid: "c3d4e5f6-a7b8-9012-3456-789abcdef012",
    dimension: "overworld",
    x: -1204.0,
    y: 68.0,
    z: 550.0,
    ping: 19,
    role: "moderator",
    gamemode: "creative",
    health: 20,
    food: 20,
    xpLevel: 99,
    onlineDuration: "5h 10m",
    inventory: [
      { id: "redstone", name: "Redstone Dust", count: 64, slot: 27 },
      { id: "repeater", name: "Redstone Repeater", count: 64, slot: 28 },
      { id: "comparator", name: "Redstone Comparator", count: 64, slot: 29 },
      { id: "piston", name: "Sticky Piston", count: 64, slot: 30 },
    ],
  },
  {
    username: "AlexTheBuilder",
    uuid: "d4e5f6a7-b8c9-0123-4567-89abcdef0123",
    dimension: "overworld",
    x: 310.2,
    y: 80.0,
    z: 140.5,
    ping: 52,
    role: "member",
    gamemode: "survival",
    health: 20,
    food: 19,
    xpLevel: 15,
    onlineDuration: "1h 50m",
    inventory: [
      { id: "stone_bricks", name: "Stone Bricks", count: 64, slot: 27 },
      { id: "spruce_wood", name: "Spruce Wood", count: 64, slot: 28 },
      { id: "glass", name: "Glass", count: 64, slot: 29 },
    ],
  },
  {
    username: "CraftyMiner",
    uuid: "e5f6a7b8-c9d0-1234-5678-9abcdef01234",
    dimension: "overworld",
    x: -45.0,
    y: 12.0,
    z: -880.0,
    ping: 88,
    role: "member",
    gamemode: "survival",
    health: 16,
    food: 14,
    xpLevel: 28,
    onlineDuration: "25m",
    inventory: [
      { id: "diamond_pickaxe", name: "Diamond Pickaxe", count: 1, slot: 27 },
      { id: "raw_iron", name: "Raw Iron", count: 42, slot: 28 },
      { id: "coal", name: "Coal", count: 64, slot: 29 },
    ],
  },
];

export interface MockWhitelistEntry {
  username: string;
  uuid: string;
  addedAt: string;
  addedBy: string;
  isOp: boolean;
}

export interface MockBanEntry {
  username: string;
  uuid: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  expires: string;
}

export interface MockIpBanEntry {
  ip: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  country?: string;
}

export const MOCK_ACCESS_CONTROL = {
  whitelistEnforced: true,
  whitelist: [
    {
      username: "_xKaelin",
      uuid: "9f8b1c4a-6d2e-4b8a-9f1e-2c3d4e5f6a7b",
      addedAt: "2026-09-01",
      addedBy: "Console",
      isOp: true,
    },
    {
      username: "notch_fan_99",
      uuid: "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
      addedAt: "2026-09-05",
      addedBy: "_xKaelin",
      isOp: false,
    },
    {
      username: "DiamondPick42",
      uuid: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      addedAt: "2026-09-10",
      addedBy: "_xKaelin",
      isOp: false,
    },
    {
      username: "EndermanSlayer",
      uuid: "f9e8d7c6-b5a4-3210-fedc-ba9876543210",
      addedAt: "2026-09-12",
      addedBy: "RedstoneMaster",
      isOp: false,
    },
    {
      username: "RedstoneMaster",
      uuid: "c3d4e5f6-a7b8-9012-3456-789abcdef012",
      addedAt: "2026-09-02",
      addedBy: "Console",
      isOp: true,
    },
    {
      username: "AlexTheBuilder",
      uuid: "d4e5f6a7-b8c9-0123-4567-89abcdef0123",
      addedAt: "2026-09-18",
      addedBy: "_xKaelin",
      isOp: false,
    },
    {
      username: "CraftyMiner",
      uuid: "e5f6a7b8-c9d0-1234-5678-9abcdef01234",
      addedAt: "2026-09-22",
      addedBy: "_xKaelin",
      isOp: false,
    },
    {
      username: "ShadowNinja",
      uuid: "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
      addedAt: "2026-10-01",
      addedBy: "RedstoneMaster",
      isOp: false,
    },
    {
      username: "PixelQueen",
      uuid: "6b7c8d9e-0f1a-2b3c-4d5e-6f7a8b9c0d1e",
      addedAt: "2026-10-04",
      addedBy: "_xKaelin",
      isOp: false,
    },
    {
      username: "VoxelHero",
      uuid: "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      addedAt: "2026-10-10",
      addedBy: "Console",
      isOp: false,
    },
    {
      username: "NetherKnight",
      uuid: "8d9e0f1a-2b3c-4d5e-6f7a-8b9c0d1e2f3a",
      addedAt: "2026-10-12",
      addedBy: "_xKaelin",
      isOp: false,
    },
    {
      username: "ObsidianGuard",
      uuid: "9e0f1a2b-3c4d-5e6f-7a8b-9c0d1e2f3a4b",
      addedAt: "2026-10-15",
      addedBy: "RedstoneMaster",
      isOp: false,
    },
  ] as MockWhitelistEntry[],
  bans: [
    {
      username: "GriefLord99",
      uuid: "b1a2c3d4-0000-1111-2222-333344445555",
      reason: "Major TNT vandalism at spawn",
      bannedBy: "_xKaelin",
      bannedAt: "2026-10-25 14:12",
      expires: "Permanent",
    },
    {
      username: "XrayVisionX",
      uuid: "c2b3a4d5-0000-1111-2222-333344446666",
      reason: "Automated baritone/x-ray mining",
      bannedBy: "CoreProtect",
      bannedAt: "2026-10-28 09:44",
      expires: "Permanent",
    },
    {
      username: "ToxicSpammer",
      uuid: "d3c4b5a6-0000-1111-2222-333344447777",
      reason: "Hate speech in public chat",
      bannedBy: "RedstoneMaster",
      bannedAt: "2026-10-29 18:20",
      expires: "2026-11-29",
    },
    {
      username: "DupingGlitcher",
      uuid: "e4d5c6b7-0000-1111-2222-333344448888",
      reason: "Shulker dupe exploit abuse",
      bannedBy: "_xKaelin",
      bannedAt: "2026-10-30 02:15",
      expires: "Permanent",
    },
    {
      username: "FlyHacker01",
      uuid: "f5e6d7c8-0000-1111-2222-333344449999",
      reason: "Movement speed hack detected",
      bannedBy: "GrimAC",
      bannedAt: "2026-10-31 04:50",
      expires: "2026-11-07",
    },
  ] as MockBanEntry[],
  ipBans: [
    {
      ip: "198.51.100.44",
      reason: "Botnet connection flood",
      bannedBy: "Console",
      bannedAt: "2026-10-22",
      country: "US",
    },
    {
      ip: "203.0.113.89",
      reason: "Malicious proxy / VPN range",
      bannedBy: "_xKaelin",
      bannedAt: "2026-10-25",
      country: "NL",
    },
    {
      ip: "192.0.2.14",
      reason: "DDoS attempt on RCON port",
      bannedBy: "Fail2Ban",
      bannedAt: "2026-10-27",
      country: "DE",
    },
    {
      ip: "198.18.0.0/15",
      reason: "Known scan network range",
      bannedBy: "Console",
      bannedAt: "2026-10-30",
      country: "Global",
    },
  ] as MockIpBanEntry[],
};

export interface MockWorldDimension {
  id: string;
  name: string;
  slug: "overworld" | "the_nether" | "the_end";
  icon: string;
  chunksLoaded: number;
  entities?: number;
  diskSizeFormatted: string;
  directory: string;
  detail: string;
  actionLabel: string;
  actionVariant: "secondary" | "danger";
}

export interface MockGamerule {
  id: string;
  name: string;
  description: string;
  category: "gameplay" | "combat" | "physics" | "admin";
  type: "boolean" | "number";
  value: boolean | number;
  unit?: string;
}

export const MOCK_WORLD = {
  activeLevelName: "world",
  seed: "-482910482910482",
  autosave: "Active (5m)",
  difficulty: "hard",
  gamemode: "survival",
  time: "14:35",
  tick: 8550,
  weather: "Clear",
  weatherCycle: "Clear for 24m",
  dimensions: [
    {
      id: "world",
      name: "Overworld",
      slug: "overworld",
      icon: "🌲",
      chunksLoaded: 418,
      diskSizeFormatted: "4.82 GB",
      directory: "world/",
      detail: "Default Spawn (0, 72, 0)",
      actionLabel: "Optimize Chunks",
      actionVariant: "secondary",
    },
    {
      id: "world_nether",
      name: "The Nether",
      slug: "the_nether",
      icon: "🌋",
      chunksLoaded: 112,
      diskSizeFormatted: "1.24 GB",
      directory: "world_nether/",
      detail: "Nether Wastes / Fortresses",
      actionLabel: "Reset Nether Dimension",
      actionVariant: "danger",
    },
    {
      id: "world_the_end",
      name: "The End",
      slug: "the_end",
      icon: "🌌",
      chunksLoaded: 48,
      diskSizeFormatted: "340 MB",
      directory: "world_the_end/",
      detail: "Ender Dragon Defeated",
      actionLabel: "Reset The End",
      actionVariant: "danger",
    },
  ] as MockWorldDimension[],
  gamerules: [
    // 1. Gameplay & Survival Mechanics (12 Rules)
    {
      id: "keepInventory",
      name: "keepInventory",
      description: "Preserve inventory items and XP upon player death",
      category: "gameplay",
      type: "boolean",
      value: false,
    },
    {
      id: "naturalRegeneration",
      name: "naturalRegeneration",
      description: "Allow natural health regen when saturation is full",
      category: "gameplay",
      type: "boolean",
      value: true,
    },
    {
      id: "playersSleepingPercentage",
      name: "playersSleepingPercentage",
      description: "Percentage of players needed to skip night",
      category: "gameplay",
      type: "number",
      value: 101,
      unit: "%",
    },
    {
      id: "doImmediateRespawn",
      name: "doImmediateRespawn",
      description: 'Skip "You Died" death screen and respawn instantly',
      category: "gameplay",
      type: "boolean",
      value: false,
    },
    {
      id: "doInsomnia",
      name: "doInsomnia",
      description: "Spawn Phantoms when players have not slept for 3 days",
      category: "gameplay",
      type: "boolean",
      value: true,
    },
    {
      id: "fallDamage",
      name: "fallDamage",
      description: "Take kinetic impact damage from high falls",
      category: "gameplay",
      type: "boolean",
      value: true,
    },
    {
      id: "fireDamage",
      name: "fireDamage",
      description: "Take damage from fire, lava, and magma blocks",
      category: "gameplay",
      type: "boolean",
      value: true,
    },
    {
      id: "drowningDamage",
      name: "drowningDamage",
      description: "Take damage when underwater oxygen bubbles deplete",
      category: "gameplay",
      type: "boolean",
      value: true,
    },
    {
      id: "freezeDamage",
      name: "freezeDamage",
      description: "Take freezing damage when immersed in powder snow",
      category: "gameplay",
      type: "boolean",
      value: true,
    },
    {
      id: "spawnRadius",
      name: "spawnRadius",
      description: "Radius in blocks around world spawn with protection",
      category: "gameplay",
      type: "number",
      value: 0,
      unit: "blocks",
    },
    {
      id: "spectatorsGenerateChunks",
      name: "spectatorsGenerateChunks",
      description: "Allow players in Spectator mode to generate new chunks",
      category: "gameplay",
      type: "boolean",
      value: true,
    },
    {
      id: "doLimitedCrafting",
      name: "doLimitedCrafting",
      description: "Require crafting recipes to be unlocked before craft",
      category: "gameplay",
      type: "boolean",
      value: false,
    },

    // 2. Mobs, Spawning & Combat (12 Rules)
    {
      id: "doMobSpawning",
      name: "doMobSpawning",
      description: "Natural spawning of hostile monsters and passive animals",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "mobGriefing",
      name: "mobGriefing",
      description: "Creeper explosions and Endermen block manipulation",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "maxEntityCramming",
      name: "maxEntityCramming",
      description: "Entity collision threshold before suffocation damage",
      category: "combat",
      type: "number",
      value: 24,
      unit: "mobs",
    },
    {
      id: "doMobLoot",
      name: "doMobLoot",
      description: "Drop resource items and XP orbs on mob death",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "doEntityDrops",
      name: "doEntityDrops",
      description: "Drop items from non-mob entities (minecarts, frames)",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "disableRaids",
      name: "disableRaids",
      description: "Completely disable Bad Omen village raids",
      category: "combat",
      type: "boolean",
      value: false,
    },
    {
      id: "doPatrolSpawning",
      name: "doPatrolSpawning",
      description: "Spawn Pillager patrol squads near players",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "doTraderSpawning",
      name: "doTraderSpawning",
      description: "Spawn Wandering Trader with llamas periodically",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "doWardenSpawning",
      name: "doWardenSpawning",
      description: "Allow Sculk Shriekers to summon the Warden",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "universalAnger",
      name: "universalAnger",
      description: "Angered neutral mobs attack any nearby player",
      category: "combat",
      type: "boolean",
      value: false,
    },
    {
      id: "forgiveDeadPlayers",
      name: "forgiveDeadPlayers",
      description: "Neutral mobs stop hostility once target player dies",
      category: "combat",
      type: "boolean",
      value: true,
    },
    {
      id: "disableElytraMovementCheck",
      name: "disableElytraMovementCheck",
      description: "Disable server fly speed check (stops rubberband)",
      category: "combat",
      type: "boolean",
      value: false,
    },

    // 3. World, Physics & Environment (11 Rules)
    {
      id: "randomTickSpeed",
      name: "randomTickSpeed",
      description: "Crop growth, leaf decay, and block update rate",
      category: "physics",
      type: "number",
      value: 3,
      unit: "ticks",
    },
    {
      id: "doDaylightCycle",
      name: "doDaylightCycle",
      description: "Dynamic solar and lunar diurnal cycle progression",
      category: "physics",
      type: "boolean",
      value: true,
    },
    {
      id: "doWeatherCycle",
      name: "doWeatherCycle",
      description: "Dynamic rain, thunder, and snowfall transitions",
      category: "physics",
      type: "boolean",
      value: true,
    },
    {
      id: "doFireTick",
      name: "doFireTick",
      description: "Fire spreading and combustible block destruction",
      category: "physics",
      type: "boolean",
      value: false,
    },
    {
      id: "doVinesSpread",
      name: "doVinesSpread",
      description: "Cave vines, weeping vines, and wall vine spreading",
      category: "physics",
      type: "boolean",
      value: true,
    },
    {
      id: "waterSourceConversion",
      name: "waterSourceConversion",
      description: "Allow infinite water creation from 2 adjacent sources",
      category: "physics",
      type: "boolean",
      value: true,
    },
    {
      id: "lavaSourceConversion",
      name: "lavaSourceConversion",
      description: "Allow infinite lava creation from 2 adjacent sources",
      category: "physics",
      type: "boolean",
      value: false,
    },
    {
      id: "snowAccumulationHeight",
      name: "snowAccumulationHeight",
      description: "Max layers of snow that accumulate during snowfall",
      category: "physics",
      type: "number",
      value: 1,
      unit: "layers",
    },
    {
      id: "doTileDrops",
      name: "doTileDrops",
      description: "Drop resource blocks when mined/broken by players",
      category: "physics",
      type: "boolean",
      value: true,
    },
    {
      id: "tntExplosionDropDecay",
      name: "tntExplosionDropDecay",
      description: "Decay/destroy a percentage of drops from primed TNT",
      category: "physics",
      type: "boolean",
      value: false,
    },
    {
      id: "blockExplosionDropDecay",
      name: "blockExplosionDropDecay",
      description: "Decay drops from beds and respawn anchor explosions",
      category: "physics",
      type: "boolean",
      value: true,
    },

    // 4. Chat, Console & Admin Operations (10 Rules)
    {
      id: "mobExplosionDropDecay",
      name: "mobExplosionDropDecay",
      description: "Decay item drops from Creeper and Ghast explosions",
      category: "admin",
      type: "boolean",
      value: true,
    },
    {
      id: "showDeathMessages",
      name: "showDeathMessages",
      description: "Broadcast global death notification messages to chat",
      category: "admin",
      type: "boolean",
      value: true,
    },
    {
      id: "announceAdvancements",
      name: "announceAdvancements",
      description: "Broadcast advancement announcements to server chat",
      category: "admin",
      type: "boolean",
      value: true,
    },
    {
      id: "sendCommandFeedback",
      name: "sendCommandFeedback",
      description: "Display command execution feedback messages in chat",
      category: "admin",
      type: "boolean",
      value: true,
    },
    {
      id: "logAdminCommands",
      name: "logAdminCommands",
      description: "Log server operator execution events to console log",
      category: "admin",
      type: "boolean",
      value: true,
    },
    {
      id: "commandBlockOutput",
      name: "commandBlockOutput",
      description: "Broadcast command block execution messages to OPs",
      category: "admin",
      type: "boolean",
      value: true,
    },
    {
      id: "reducedDebugInfo",
      name: "reducedDebugInfo",
      description: "Hide coordinates and biome info on F3 debug screen",
      category: "admin",
      type: "boolean",
      value: false,
    },
    {
      id: "globalSoundEvents",
      name: "globalSoundEvents",
      description: "Play global sound effects (Wither spawn, End portal)",
      category: "admin",
      type: "boolean",
      value: true,
    },
    {
      id: "maxCommandChainLength",
      name: "maxCommandChainLength",
      description: "Max chain commands per tick for command blocks",
      category: "admin",
      type: "number",
      value: 65536,
      unit: "ops",
    },
    {
      id: "commandModificationBlockLimit",
      name: "commandModificationBlockLimit",
      description: "Max blocks in single /clone, /fill, or /setblock",
      category: "admin",
      type: "number",
      value: 32768,
      unit: "blocks",
    },
  ] as MockGamerule[],
};

export interface MockModItem {
  id: string;
  name: string;
  fileName: string;
  version: string;
  sizeFormatted: string;
  type: "plugin" | "mod";
  enabled: boolean;
  author: string;
  description: string;
}

export const MOCK_MODS: MockModItem[] = [
  {
    id: "fastasyncworldedit",
    name: "FastAsyncWorldEdit",
    fileName: "FastAsyncWorldEdit-Bukkit-2.11.2.jar",
    version: "2.11.2",
    sizeFormatted: "14.2 MB",
    type: "plugin",
    enabled: true,
    author: "IntellectualSites",
    description: "Blazing fast asynchronous voxel world manipulation and brush tools",
  },
  {
    id: "luckperms",
    name: "LuckPerms",
    fileName: "LuckPerms-Bukkit-5.4.102.jar",
    version: "5.4.102",
    sizeFormatted: "3.8 MB",
    type: "plugin",
    enabled: true,
    author: "Luck",
    description: "Modern, comprehensive permissions management with web editor",
  },
  {
    id: "vault",
    name: "Vault",
    fileName: "Vault-1.7.3.jar",
    version: "1.7.3",
    sizeFormatted: "380 KB",
    type: "plugin",
    enabled: true,
    author: "Sleaker",
    description: "Unified economy and permission hook bridge for Paper servers",
  },
  {
    id: "essentialsx",
    name: "EssentialsX",
    fileName: "EssentialsX-2.20.1.jar",
    version: "2.20.1",
    sizeFormatted: "4.1 MB",
    type: "plugin",
    enabled: true,
    author: "EssentialsX Team",
    description: "Core survival server commands, teleports, and warps suite",
  },
  {
    id: "dynmap",
    name: "Dynmap",
    fileName: "Dynmap-3.7-beta-paper.jar",
    version: "3.7-beta",
    sizeFormatted: "28.5 MB",
    type: "plugin",
    enabled: true,
    author: "mikeprimm",
    description: "Realtime dynamic Google Maps-style web viewer for Minecraft",
  },
  {
    id: "viaversion",
    name: "ViaVersion",
    fileName: "ViaVersion-5.0.3.jar",
    version: "5.0.3",
    sizeFormatted: "7.2 MB",
    type: "plugin",
    enabled: true,
    author: "MylesMc",
    description: "Allows newer Minecraft client versions to connect smoothly",
  },
  {
    id: "coreprotect",
    name: "CoreProtect",
    fileName: "CoreProtect-22.4.jar",
    version: "22.4",
    sizeFormatted: "2.1 MB",
    type: "plugin",
    enabled: true,
    author: "Intelli",
    description: "Fast, database-backed block inspection and grief rollback",
  },
  {
    id: "spark",
    name: "Spark",
    fileName: "spark-1.10.53-bukkit.jar",
    version: "1.10.53",
    sizeFormatted: "4.6 MB",
    type: "plugin",
    enabled: true,
    author: "Luck",
    description: "Performance profiler for CPU tick duration and memory leaks",
  },
  {
    id: "chunky",
    name: "Chunky",
    fileName: "Chunky-1.3.92.jar",
    version: "1.3.92",
    sizeFormatted: "890 KB",
    type: "plugin",
    enabled: false,
    author: "pop4959",
    description: "Pre-generates world chunks in advance to eliminate flight lag",
  },
];

export interface MockTelemetryData {
  hostCpu: string;
  hostRam: string;
  hostDisk: string;
  engineVersion: string;
  jvmVersion: string;
  paperBuild: string;
  uptime: string;
  cpuPercent: number;
  heapUsedMb: number;
  heapMaxMb: number;
  tps: number;
  mspt: number;
  msptPercentiles: { p50: number; p95: number; p99: number };
  gcPauses: { youngCount: number; youngTimeMs: number; oldCount: number; oldTimeMs: number };
  profilerSamples: { method: string; selfTimeMs: number; percent: number; category: string }[];
}

export const MOCK_TELEMETRY: MockTelemetryData = {
  hostCpu: "AMD Ryzen 9 7950X 16-Core @ 4.5 GHz",
  hostRam: "64 GB DDR5 ECC 5200 MT/s",
  hostDisk: "2x 2 TB NVMe PCIe 4.0 RAID1",
  engineVersion: "Paper 1.21.1",
  jvmVersion: "Eclipse Temurin 21.0.4+7",
  paperBuild: "git-Paper-128 (MC: 1.21.1)",
  uptime: "4 days, 16 hours, 28 minutes",
  cpuPercent: 18.4,
  heapUsedMb: 6144,
  heapMaxMb: 12288,
  tps: 19.8,
  mspt: 14.2,
  msptPercentiles: { p50: 14.2, p95: 18.5, p99: 24.1 },
  gcPauses: { youngCount: 3412, youngTimeMs: 412, oldCount: 8, oldTimeMs: 95 },
  profilerSamples: [
    {
      method: "net.minecraft.world.level.Level.tick()",
      selfTimeMs: 6.4,
      percent: 45.1,
      category: "World Tick",
    },
    {
      method: "net.minecraft.server.level.ServerChunkCache.tick()",
      selfTimeMs: 2.8,
      percent: 19.7,
      category: "Chunk Provider",
    },
    {
      method: "net.minecraft.world.entity.LivingEntity.aiStep()",
      selfTimeMs: 2.1,
      percent: 14.8,
      category: "Entity AI",
    },
    {
      method: "net.minecraft.network.Connection.tick()",
      selfTimeMs: 1.2,
      percent: 8.5,
      category: "Network I/O",
    },
    {
      method: "net.minecraft.world.level.lighting.LevelLightEngine.runUpdates()",
      selfTimeMs: 0.9,
      percent: 6.3,
      category: "Lighting Engine",
    },
  ],
};

export const MOCK_CONSOLE_LOGS = [
  "[08:14:02 INFO]: Starting minecraft server version 1.21.1",
  "[08:14:03 INFO]: Loading properties from /data/server.properties",
  "[08:14:05 INFO]: This server is running Paper version git-Paper-128 (MC: 1.21.1)",
  "[08:14:07 INFO]: [LuckPerms] Loading LuckPerms v5.4.102...",
  "[08:14:08 INFO]: [LuckPerms] Loading configuration...",
  "[08:14:09 INFO]: [Vault] [Economy] Essentials Economy hooked.",
  "[08:14:10 INFO]: [FastAsyncWorldEdit] Enabled successfully. Platform: Paper",
  '[08:14:11 INFO]: Preparing level "world"',
  "[08:14:12 INFO]: Preparing start region for dimension minecraft:overworld",
  "[08:14:14 INFO]: Time elapsed: 2410 ms",
  "[08:14:15 INFO]: [Spark] Profiler background sampler initialized.",
  '[08:14:16 INFO]: Done (14.201s)! For help, type "help"',
  "[09:22:45 INFO]: _xKaelin[/192.168.1.105:54210] logged in with entity id 412 at (124.5, 72.0, -340.2)",
  "[09:30:12 INFO]: notch_fan_99 joined the server",
  "[10:04:18 WARN]: Can't keep up! Is the server overloaded? Running 2154ms or 43 ticks behind",
  "[10:05:00 INFO]: [AutoBackup] Snapshot backup initiated for world, world_nether, world_the_end",
  "[10:05:24 INFO]: [AutoBackup] Backup completed in 24.2s. Archive: backup-2026-10-31-1005.tar.gz (4.82 GB)",
  "[11:15:33 INFO]: <_xKaelin> Heading out to coordinate -1200 to link nether portal",
  "[11:42:01 INFO]: [RCON] Issued command: /tps",
  "[11:42:01 INFO]: [RCON] TPS from last 1m, 5m, 15m: 19.98, 19.95, 19.92",
];

export const MOCK_CHAT_MESSAGES = [
  {
    id: "c1",
    sender: "_xKaelin",
    role: "admin",
    text: "Welcome everyone to Season 4! Spawn town hall is fully stocked.",
    timestamp: "10:14 AM",
    channel: "Global",
  },
  {
    id: "c2",
    sender: "notch_fan_99",
    role: "vip",
    text: "Nice! Does anyone have extra glowstone dust?",
    timestamp: "10:18 AM",
    channel: "Global",
  },
  {
    id: "c3",
    sender: "DiamondPick42",
    role: "member",
    text: "I have two stacks in my market stall chest near the fountain.",
    timestamp: "10:20 AM",
    channel: "Global",
  },
  {
    id: "c4",
    sender: "EndermanSlayer",
    role: "vip",
    text: "End portal frame is located at x: -1450, z: 820.",
    timestamp: "10:35 AM",
    channel: "Global",
  },
  {
    id: "c5",
    sender: "RedstoneMaster",
    role: "moderator",
    text: "Please do not build clock generators without an on/off lever.",
    timestamp: "10:42 AM",
    channel: "Global",
  },
  {
    id: "c6",
    sender: "_xKaelin",
    role: "admin",
    text: "Staff note: backup scheduled at 05:00 daily.",
    timestamp: "10:50 AM",
    channel: "Staff",
  },
  {
    id: "c7",
    sender: "AlexTheBuilder",
    role: "member",
    text: "Working on the harbor bridge now, wood donations appreciated!",
    timestamp: "11:05 AM",
    channel: "Global",
  },
  {
    id: "c8",
    sender: "DiscordBot",
    role: "vip",
    text: "[Discord] @Steve: Hey is the live map working today?",
    timestamp: "11:12 AM",
    channel: "Discord",
  },
  {
    id: "c9",
    sender: "_xKaelin",
    role: "admin",
    text: "Yes, map is active on port 8123 or via the Live Map tab.",
    timestamp: "11:14 AM",
    channel: "Global",
  },
];
