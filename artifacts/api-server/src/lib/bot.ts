import {
  Client,
  GatewayIntentBits,
  ActivityType,
  type PresenceStatusData,
  Events,
  InteractionType,
} from "discord.js";
import { db, matcherinoEventsTable } from "@workspace/db";
import { gt, isNull, asc } from "drizzle-orm";
import {
  text, sep, gallery, container, cv2, linkButton, actionRow,
  sendCv2Message, replyInteraction, registerSlashCommands,
  tsLong, tsRelative,
} from "../utils/cv2.js";
import { generateMatcherinoCard } from "./matcherinoCard.js";

// ─── Presence ─────────────────────────────────────────────────────────────────

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

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

let connected = false;
let connectedAt: Date | null = null;
let currentPresence: BotPresence = {
  status: "online",
  activityKind: "none",
  activityName: "",
  streamUrl: "",
};

// ─── Slash commands definition ─────────────────────────────────────────────────

const SLASH_COMMANDS = [
  {
    name: "event",
    description: "Show upcoming VOID Matcherino tournaments",
  },
];

// ─── Ready ────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, async (c) => {
  connected = true;
  connectedAt = new Date();
  console.log(`[Bot] Logged in as ${c.user.tag}`);

  const token = process.env.DISCORD_BOT_TOKEN!;
  try {
    await registerSlashCommands(c.user.id, token, SLASH_COMMANDS);
  } catch (err) {
    console.error("[Bot] Failed to register slash commands:", err);
  }
});

client.on("error", (err) => {
  console.error("[Bot] Error:", err);
  connected = false;
});

client.on("shardDisconnect", () => {
  connected = false;
});

// ─── Interaction handler ───────────────────────────────────────────────────────

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.type !== InteractionType.ApplicationCommand) return;
  if (interaction.commandName !== "event") return;

  try {
    const now = new Date();
    const events = await db
      .select()
      .from(matcherinoEventsTable)
      .where(isNull(matcherinoEventsTable.finalizedAt))
      .orderBy(asc(matcherinoEventsTable.startAt))
      .limit(5);

    const upcoming = events.filter(
      (e) => e.startAt && new Date(e.startAt) > now,
    );

    if (!upcoming.length) {
      await replyInteraction(
        interaction.id,
        interaction.token,
        cv2([
          container([
            text("# 🏆 Upcoming Tournaments"),
            sep(),
            text("No upcoming tournaments at the moment.\nCheck back soon!"),
          ], 0x8b5cf6),
        ]),
        true,
      );
      return;
    }

    const children: ReturnType<typeof text | typeof sep>[] = [
      text("# 🏆 Upcoming VOID Tournaments"),
      sep(2),
    ];

    for (let i = 0; i < upcoming.length; i++) {
      const ev = upcoming[i];
      const startUnix = ev.startAt ? Math.floor(new Date(ev.startAt).getTime() / 1000) : null;
      const endUnix = ev.endAt ? Math.floor(new Date(ev.endAt).getTime() / 1000) : null;

      let dateBlock = "";
      if (startUnix) {
        dateBlock += `📅 **Starts** <t:${startUnix}:F> — <t:${startUnix}:R>`;
      }
      if (endUnix) {
        dateBlock += `\n🏁 **Ends** <t:${endUnix}:F>`;
      }

      children.push(
        text(
          `**${ev.title}**\n${dateBlock}\n\n` +
          `🔗 [View on VOID](https://void.meonix.me/matcherino/${ev.id})`,
        ),
      );
      if (i < upcoming.length - 1) children.push(sep());
    }

    await replyInteraction(
      interaction.id,
      interaction.token,
      cv2([container(children as Parameters<typeof container>[0], 0x8b5cf6)]),
    );
  } catch (err) {
    console.error("[Bot] /event error:", err);
    try {
      await replyInteraction(
        interaction.id,
        interaction.token,
        cv2([container([text("❌ Failed to load events. Please try again later.")])]),
        true,
      );
    } catch {}
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

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

// ─── Matcherino announcement (Components V2) ──────────────────────────────────

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
  pingId?: string;
}

const ACCENT_PURPLE = 0x8b5cf6;
const VOID_BASE = "https://void.meonix.me";

export async function sendMatcherinoAnnouncement(
  channelId: string,
  event: MatcherinoAnnouncePayload,
): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not set");

  const startUnix = event.startAt
    ? Math.floor(new Date(event.startAt).getTime() / 1000)
    : null;
  const endUnix = event.endAt
    ? Math.floor(new Date(event.endAt).getTime() / 1000)
    : null;

  // ── Build date block ──
  let dateBlock = "";
  if (startUnix) {
    dateBlock += `📅 **Starts** <t:${startUnix}:F>\n⏰ <t:${startUnix}:R>`;
  }
  if (endUnix) {
    dateBlock += `\n🏁 **Ends** <t:${endUnix}:F>`;
  }
  if (!dateBlock) dateBlock = "📅 Date TBA";

  // ── Build link buttons ──
  const voidLink = `${VOID_BASE}/matcherino/${event.id}`;
  const matcherinoLink = `https://matcherino.com/tournaments/${event.id}`;
  const buttons = actionRow([
    linkButton("View on VOID", voidLink, { name: "🔗" }),
    linkButton("View on Matcherino", matcherinoLink, {
      id: "1494738441349632050",
      name: "matcherino5e",
    }),
  ]);

  // ── Generate sharp card ──
  let cardBuffer: Buffer | null = null;
  try {
    cardBuffer = await generateMatcherinoCard(event);
  } catch (err) {
    console.error("[Bot] Failed to generate matcherino card:", err);
  }

  // ── Assemble container children ──
  const shouldPing = !!event.pingId && !event.isTest;
  const children: Parameters<typeof container>[0] = [];
  if (shouldPing) {
    children.push(text(`<@&${event.pingId}>`));
    children.push(sep());
  }
  children.push(
    text(event.isTest ? "# 🧪 [TEST] New Tournament" : "# 🏆 New Tournament"),
    text(`**${event.title}**${event.gameTitle ? ` — *${event.gameTitle}*` : ""}`),
    sep(),
  );

  if (cardBuffer) {
    children.push(gallery(["attachment://card.png"]));
    children.push(sep());
  }

  children.push(text(dateBlock));
  children.push(sep());
  children.push(buttons);
  children.push(text("-# Sent automatically by VOID bot"));

  const payload = cv2([container(children, ACCENT_PURPLE)]);
  if (shouldPing && event.pingId) {
    payload.allowed_mentions = { parse: [], roles: [event.pingId] };
  }

  await sendCv2Message(
    channelId,
    payload,
    token,
    cardBuffer
      ? [{ name: "card.png", data: cardBuffer, contentType: "image/png" }]
      : undefined,
  );
}

// ─── Presence ─────────────────────────────────────────────────────────────────

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

  client.user.setPresence({ status: statusMap[presence.status], activities });
  currentPresence = { ...presence };
}
