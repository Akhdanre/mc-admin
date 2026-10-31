import type { ChatMessage } from "@/types";

// Matches Forge / Vanilla timestamps: [06Oct2026 11:48:04.547] or [11:48:04]
const TIMESTAMP_REGEX = /^\[([^\]]+)\]/;

// Matches [Not Secure] <Username> Message or <Username> Message
const PLAYER_CHAT_REGEX = /<([a-zA-Z0-9_]{1,16})>\s*(.*)$/;

// Matches [Server] or [Rcon] Message
const SERVER_CHAT_REGEX = /\[(Server|Rcon)\]\s*(.*)$/;

export const JOIN_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+joined the game/;
export const LEAVE_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+left the game/;
export const ADVANCEMENT_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+(has made the advancement|has completed the challenge|has reached the goal)\s+(\[.+\])/;
export const DEATH_REGEX = /:\s*([a-zA-Z0-9_]{1,16})\s+(was slain by|was shot by|was blown up by|was killed by|was impaled by|was doomed to fall by|fell from a high place|fell out of the world|fell off|hit the ground too hard|drowned|withered away|burned to death|went up in flames|walked into fire|walked into danger|suffocated in a wall|tried to swim in lava|starved to death|died|was squashed by|was struck by lightning|froze to death|discovered floor was lava|was stung to death|was roasted|was squished|experienced kinetic energy|blew up|was killed)(.*)$/;

export interface ParsedServerEvent {
  type: "join" | "leave" | "advancement" | "death";
  title: string;
  description: string;
  color: number;
}

export function parseServerEvent(line: string): ParsedServerEvent | null {
  const joinMatch = line.match(JOIN_REGEX);
  if (joinMatch && joinMatch[1]) {
    return {
      type: "join",
      title: "Player Joined",
      description: `**${joinMatch[1]}** joined the game`,
      color: 0x57f287,
    };
  }

  const leaveMatch = line.match(LEAVE_REGEX);
  if (leaveMatch && leaveMatch[1]) {
    return {
      type: "leave",
      title: "Player Left",
      description: `**${leaveMatch[1]}** left the game`,
      color: 0xed4245,
    };
  }

  const advMatch = line.match(ADVANCEMENT_REGEX);
  if (advMatch && advMatch[1] && advMatch[2] && advMatch[3]) {
    return {
      type: "advancement",
      title: "Advancement Made",
      description: `🏆 **${advMatch[1]}** ${advMatch[2]} **${advMatch[3]}**`,
      color: 0xfee75c,
    };
  }

  const deathMatch = line.match(DEATH_REGEX);
  if (deathMatch && deathMatch[1] && deathMatch[2]) {
    const victim = deathMatch[1];
    const deathText = `${victim} ${deathMatch[2]}${deathMatch[3] || ""}`.trim();
    return {
      type: "death",
      title: "Player Death",
      description: `💀 **${deathText}**`,
      color: 0xed4245,
    };
  }

  return null;
}

export function parseChatLine(line: string, index: number): ChatMessage | null {
  const tsMatch = line.match(TIMESTAMP_REGEX);
  const timestamp = tsMatch?.[1] ? tsMatch[1] : "";

  const playerMatch = line.match(PLAYER_CHAT_REGEX);
  if (playerMatch && playerMatch[1] && playerMatch[2]) {
    return {
      id: `chat-${index}-${Date.now()}`,
      sender: playerMatch[1],
      message: playerMatch[2].trim(),
      timestamp,
      isServer: false,
    };
  }

  const serverMatch = line.match(SERVER_CHAT_REGEX);
  if (serverMatch && serverMatch[2]) {
    return {
      id: `chat-${index}-${Date.now()}`,
      sender: "Server",
      message: serverMatch[2].trim(),
      timestamp,
      isServer: true,
    };
  }

  return null;
}
