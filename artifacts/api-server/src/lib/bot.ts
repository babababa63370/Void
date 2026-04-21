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
  text, sep, gallery, container, cv2, linkButton, actionRow, stringSelect,
  sendCv2Message, replyInteraction, respondAutocomplete, registerSlashCommands,
  tsLong, tsRelative,
} from "../utils/cv2.js";
import { generateMatcherinoCard } from "./matcherinoCard.js";
import {
  getBrawlRotation, getActiveEvents, parseApiTime, prettyMode,
  type BrawlEvent,
} from "./brawlEvents.js";

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

export const SLASH_COMMANDS = [
  {
    name: "event",
    description: "Show upcoming VOID Matcherino tournaments",
  },
  {
    name: "maps",
    description: "Show the current Brawl Stars map rotation",
    options: [
      {
        name: "event",
        description: "Pick a specific event to view its map",
        type: 3, // STRING
        required: false,
        autocomplete: true,
      },
    ],
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

const BRAWL_ACCENT = 0xffcc00;

async function handleEventCommand(interaction: any): Promise<void> {
  const now = new Date();
  const events = await db
    .select()
    .from(matcherinoEventsTable)
    .where(isNull(matcherinoEventsTable.finalizedAt))
    .orderBy(asc(matcherinoEventsTable.startAt))
    .limit(5);

  const upcoming = events.filter((e) => e.startAt && new Date(e.startAt) > now);

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

  const children: Parameters<typeof container>[0] = [
    text("# 🏆 Upcoming VOID Tournaments"),
    sep(2),
  ];

  for (let i = 0; i < upcoming.length; i++) {
    const ev = upcoming[i];
    const startUnix = ev.startAt ? Math.floor(new Date(ev.startAt).getTime() / 1000) : null;
    const endUnix = ev.endAt ? Math.floor(new Date(ev.endAt).getTime() / 1000) : null;

    let dateBlock = "";
    if (startUnix) dateBlock += `📅 **Starts** <t:${startUnix}:F> — <t:${startUnix}:R>`;
    if (endUnix) dateBlock += `\n🏁 **Ends** <t:${endUnix}:F>`;

    children.push(text(`**${ev.title}**\n${dateBlock}`));
    children.push(
      actionRow([
        linkButton("View on VOID", `${VOID_BASE}/matcherino/${ev.id}`, { name: "🔗" }),
        linkButton("View on Matcherino", `https://matcherino.com/tournaments/${ev.id}`, {
          id: "1494738441349632050",
          name: "matcherino5e",
        }),
      ]),
    );
    if (i < upcoming.length - 1) children.push(sep());
  }

  await replyInteraction(
    interaction.id,
    interaction.token,
    cv2([container(children, 0x8b5cf6)]),
  );
}

function buildMapDetail(ev: BrawlEvent): ReturnType<typeof cv2> {
  const startUnix = Math.floor(parseApiTime(ev.startTime).getTime() / 1000);
  const endUnix = Math.floor(parseApiTime(ev.endTime).getTime() / 1000);
  const children: Parameters<typeof container>[0] = [
    text(`# ${ev.event.map}`),
    text(`**Mode** — ${prettyMode(ev.event.mode)}`),
    sep(),
  ];
  if (ev.event.mapImage) {
    children.push(gallery([ev.event.mapImage]));
    children.push(sep());
  }
  let timeBlock = "";
  if (!isNaN(startUnix)) timeBlock += `🟢 **Started** <t:${startUnix}:R>`;
  if (!isNaN(endUnix)) timeBlock += `${timeBlock ? "\n" : ""}🔴 **Ends** <t:${endUnix}:F> — <t:${endUnix}:R>`;
  if (timeBlock) children.push(text(timeBlock));
  return cv2([container(children, BRAWL_ACCENT)]);
}

function buildMapOverview(active: BrawlEvent[]): ReturnType<typeof cv2> {
  const children: Parameters<typeof container>[0] = [
    text("# Brawl Stars — Rotation en cours"),
    text(`${active.length} événement${active.length > 1 ? "s" : ""} actuellement disponible${active.length > 1 ? "s" : ""}. Sélectionne un événement ci-dessous pour voir sa map.`),
    sep(),
  ];

  // List of active events as text
  for (const ev of active.slice(0, 20)) {
    const endUnix = Math.floor(parseApiTime(ev.endTime).getTime() / 1000);
    const endPart = !isNaN(endUnix) ? ` — ends <t:${endUnix}:R>` : "";
    children.push(text(`**${prettyMode(ev.event.mode)}** — ${ev.event.map}${endPart}`));
  }

  children.push(sep());
  children.push(
    actionRow([
      stringSelect(
        "maps_select",
        active.slice(0, 25).map((ev) => ({
          label: `${prettyMode(ev.event.mode)} — ${ev.event.map}`.slice(0, 100),
          value: String(ev.event.id),
          description: `ID ${ev.event.id}`.slice(0, 100),
        })),
        "Choisis un événement",
      ),
    ]),
  );

  return cv2([container(children, BRAWL_ACCENT)]);
}

async function handleMapsCommand(interaction: any): Promise<void> {
  const opts = interaction.options;
  const eventIdStr = typeof opts?.getString === "function" ? opts.getString("event") : null;

  let rotation: BrawlEvent[];
  try {
    rotation = await getBrawlRotation();
  } catch (err) {
    console.error("[Bot] /maps: API error:", err);
    await replyInteraction(
      interaction.id,
      interaction.token,
      cv2([container([text("❌ L'API Brawl Stars est indisponible. Réessaie dans quelques instants.")], BRAWL_ACCENT)]),
      true,
    );
    return;
  }

  const active = getActiveEvents(rotation);

  if (eventIdStr) {
    const found = active.find((e) => String(e.event.id) === eventIdStr);
    if (!found) {
      await replyInteraction(
        interaction.id,
        interaction.token,
        cv2([container([text("❌ Cet événement n'est plus en cours.")], BRAWL_ACCENT)]),
        true,
      );
      return;
    }
    await replyInteraction(interaction.id, interaction.token, buildMapDetail(found));
    return;
  }

  if (!active.length) {
    await replyInteraction(
      interaction.id,
      interaction.token,
      cv2([container([text("# Brawl Stars"), sep(), text("Aucun événement en cours pour le moment.")], BRAWL_ACCENT)]),
      true,
    );
    return;
  }

  await replyInteraction(interaction.id, interaction.token, buildMapOverview(active));
}

async function handleMapsAutocomplete(interaction: any): Promise<void> {
  const focused = typeof interaction.options?.getFocused === "function"
    ? interaction.options.getFocused()
    : "";
  const query = String(focused ?? "").toLowerCase();

  let rotation: BrawlEvent[] = [];
  try {
    rotation = await getBrawlRotation();
  } catch {
    // ignore
  }
  const active = getActiveEvents(rotation);
  const filtered = active.filter((ev) => {
    if (!query) return true;
    return (
      ev.event.map.toLowerCase().includes(query) ||
      prettyMode(ev.event.mode).toLowerCase().includes(query)
    );
  });

  await respondAutocomplete(
    interaction.id,
    interaction.token,
    filtered.slice(0, 25).map((ev) => ({
      name: `${prettyMode(ev.event.mode)} — ${ev.event.map}`.slice(0, 100),
      value: String(ev.event.id),
    })),
  );
}

async function handleMapsSelect(interaction: any): Promise<void> {
  const value: string = interaction.values?.[0];
  let rotation: BrawlEvent[];
  try {
    rotation = await getBrawlRotation();
  } catch {
    await replyInteraction(
      interaction.id,
      interaction.token,
      cv2([container([text("❌ API Brawl Stars indisponible.")], BRAWL_ACCENT)]),
      true,
    );
    return;
  }
  const found = getActiveEvents(rotation).find((e) => String(e.event.id) === value);
  if (!found) {
    await replyInteraction(
      interaction.id,
      interaction.token,
      cv2([container([text("❌ Cet événement n'est plus en cours.")], BRAWL_ACCENT)]),
      true,
    );
    return;
  }
  await replyInteraction(interaction.id, interaction.token, buildMapDetail(found), true);
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.type === InteractionType.ApplicationCommand) {
      if (interaction.commandName === "event") return void (await handleEventCommand(interaction));
      if (interaction.commandName === "maps") return void (await handleMapsCommand(interaction));
      return;
    }
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      if (interaction.commandName === "maps") return void (await handleMapsAutocomplete(interaction));
      return;
    }
    if (interaction.type === InteractionType.MessageComponent) {
      if ((interaction as any).customId === "maps_select") {
        return void (await handleMapsSelect(interaction));
      }
      return;
    }
  } catch (err) {
    console.error("[Bot] Interaction error:", err);
    if (interaction.type === InteractionType.ApplicationCommand || interaction.type === InteractionType.MessageComponent) {
      try {
        await replyInteraction(
          interaction.id,
          interaction.token,
          cv2([container([text("❌ Une erreur est survenue. Réessaie plus tard.")])]),
          true,
        );
      } catch {}
    }
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
