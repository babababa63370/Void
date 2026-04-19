import { Client, GatewayIntentBits, ActivityType, type PresenceStatusData, EmbedBuilder, TextChannel } from "discord.js";

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

export interface MatcherinoAnnouncePayload {
  id: number;
  title: string;
  gameTitle: string | null;
  heroImg: string;
  startAt: string | null;
  endAt: string | null;
  participantsCount: number;
  totalBalance: number;
  isTest?: boolean;
}

export async function sendMatcherinoAnnouncement(
  channelId: string,
  event: MatcherinoAnnouncePayload,
): Promise<void> {
  if (!connected || !client.isReady()) throw new Error("Bot not connected");
  const channel = await client.channels.fetch(channelId);
  if (!channel || !(channel instanceof TextChannel)) throw new Error("Channel not found or not a text channel");

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const embed = new EmbedBuilder()
    .setColor(0x8b5cf6)
    .setTitle((event.isTest ? "🧪 [TEST] " : "🏆 ") + event.title)
    .setURL(`https://matcherino.com/tournaments/${event.id}`)
    .setDescription(
      `**Tournoi #${event.id}** · ${event.gameTitle ?? "Brawl Stars"}\n\n` +
      (event.isTest ? "*Ceci est un message de test — ignore it.*\n" : ""),
    )
    .addFields(
      { name: "📅 Début", value: event.startAt ? formatDate(event.startAt) : "À définir", inline: true },
      { name: "🏁 Fin", value: event.endAt ? formatDate(event.endAt) : "—", inline: true },
      { name: "👥 Participants", value: String(event.participantsCount), inline: true },
      ...(event.totalBalance > 0
        ? [{ name: "💰 Prize Pool", value: `$${event.totalBalance}`, inline: true }]
        : []),
    )
    .setFooter({ text: "VOID Esport · Matcherino" })
    .setTimestamp();

  if (event.heroImg) embed.setImage(event.heroImg);

  await channel.send({ embeds: [embed] });
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
