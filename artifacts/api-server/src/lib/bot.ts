import { Client, GatewayIntentBits, ActivityType, type PresenceStatusData } from "discord.js";

export type BotStatus = "online" | "idle" | "dnd" | "invisible";
export type ActivityKind = "none" | "playing" | "listening" | "watching" | "streaming" | "competing";

export interface BotPresence {
  status: BotStatus;
  activityKind: ActivityKind;
  activityName: string;
  streamUrl: string;
}

export interface BotInfo {
  connected: boolean;
  username: string | null;
  discriminator: string | null;
  avatar: string | null;
  id: string | null;
  connectedAt: string | null;
  presence: BotPresence;
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

let connected = false;
let connectedAt: Date | null = null;
let currentPresence: BotPresence = {
  status: "online",
  activityKind: "none",
  activityName: "",
  streamUrl: "",
};

client.once("clientReady", () => {
  connected = true;
  connectedAt = new Date();
  console.log(`[Bot] Logged in as ${client.user?.tag}`);
});

client.on("error", (err) => {
  console.error("[Bot] Error:", err);
  connected = false;
});

client.on("shardDisconnect", () => {
  connected = false;
});

export async function startBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn("[Bot] DISCORD_BOT_TOKEN not set, bot will not start");
    return;
  }
  try {
    await client.login(token);
  } catch (err) {
    console.error("[Bot] Failed to login:", err);
  }
}

export function getBotInfo(): BotInfo {
  return {
    connected,
    username: client.user?.username ?? null,
    discriminator: client.user?.discriminator ?? null,
    avatar: client.user?.avatar ?? null,
    id: client.user?.id ?? null,
    connectedAt: connectedAt?.toISOString() ?? null,
    presence: { ...currentPresence },
  };
}

export async function setBotPresence(presence: BotPresence): Promise<void> {
  if (!connected || !client.user) throw new Error("Bot not connected");

  const statusMap: Record<BotStatus, PresenceStatusData> = {
    online: "online",
    idle: "idle",
    dnd: "dnd",
    invisible: "invisible",
  };

  const activities = [];

  if (presence.activityKind !== "none" && presence.activityName) {
    const typeMap: Record<ActivityKind, ActivityType | null> = {
      none: null,
      playing: ActivityType.Playing,
      listening: ActivityType.Listening,
      watching: ActivityType.Watching,
      streaming: ActivityType.Streaming,
      competing: ActivityType.Competing,
    };
    const type = typeMap[presence.activityKind];
    if (type !== null) {
      const activity: { name: string; type: ActivityType; url?: string } = {
        name: presence.activityName,
        type,
      };
      if (presence.activityKind === "streaming" && presence.streamUrl) {
        activity.url = presence.streamUrl;
      }
      activities.push(activity);
    }
  }

  client.user.setPresence({
    status: statusMap[presence.status],
    activities,
  });

  currentPresence = { ...presence };
}
