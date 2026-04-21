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
import {
  banUser, unbanUser, kickUser, timeoutUser, moveUser,
  sendDM, logModeration,
  dmBan, dmKick, dmMute, dmUnmute, dmMove,
  replySuccess, replyError,
  ACCENT_RED, ACCENT_ORANGE, ACCENT_GREEN,
} from "./moderation.js";

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
        type: 3,
        required: false,
        autocomplete: true,
      },
    ],
  },
  {
    name: "ban",
    description: "Bannir un membre du serveur",
    default_member_permissions: "4", // BAN_MEMBERS
    dm_permission: false,
    options: [
      { name: "user", description: "Utilisateur à bannir", type: 6, required: true },
      { name: "reason", description: "Raison du ban", type: 3, required: false },
      { name: "delete_days", description: "Supprimer N jours de messages (0-7)", type: 4, required: false, min_value: 0, max_value: 7 },
    ],
  },
  {
    name: "unban",
    description: "Débannir un utilisateur par son ID",
    default_member_permissions: "4",
    dm_permission: false,
    options: [
      { name: "user_id", description: "ID Discord de l'utilisateur", type: 3, required: true },
      { name: "reason", description: "Raison du débannissement", type: 3, required: false },
    ],
  },
  {
    name: "kick",
    description: "Expulser un membre du serveur",
    default_member_permissions: "2", // KICK_MEMBERS
    dm_permission: false,
    options: [
      { name: "user", description: "Utilisateur à expulser", type: 6, required: true },
      { name: "reason", description: "Raison", type: 3, required: false },
    ],
  },
  {
    name: "mute",
    description: "Rendre un membre muet (timeout)",
    default_member_permissions: "1099511627776", // MODERATE_MEMBERS
    dm_permission: false,
    options: [
      { name: "user", description: "Utilisateur à muter", type: 6, required: true },
      { name: "duration", description: "Durée", type: 4, required: true, min_value: 1 },
      {
        name: "unit",
        description: "Unité de durée",
        type: 3,
        required: true,
        choices: [
          { name: "minutes", value: "m" },
          { name: "heures", value: "h" },
          { name: "jours", value: "d" },
        ],
      },
      { name: "reason", description: "Raison", type: 3, required: false },
    ],
  },
  {
    name: "demute",
    description: "Retirer le mute d'un membre",
    default_member_permissions: "1099511627776",
    dm_permission: false,
    options: [
      { name: "user", description: "Utilisateur à démuter", type: 6, required: true },
      { name: "reason", description: "Raison", type: 3, required: false },
    ],
  },
  {
    name: "move",
    description: "Déplacer un membre dans un autre salon vocal",
    default_member_permissions: "16777216", // MOVE_MEMBERS
    dm_permission: false,
    options: [
      { name: "user", description: "Utilisateur à déplacer", type: 6, required: true },
      { name: "channel", description: "Salon vocal de destination", type: 7, required: true, channel_types: [2, 13] },
      { name: "reason", description: "Raison", type: 3, required: false },
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
    text(`# 🗺️ ${ev.event.map}`),
    text(`-# ${prettyMode(ev.event.mode)}`),
    sep(2),
  ];

  if (ev.event.mapImage) {
    children.push(gallery([ev.event.mapImage]));
    children.push(sep(2));
  }

  children.push(text("### ⏱️ Rotation"));
  const lines: string[] = [];
  if (!isNaN(startUnix)) lines.push(`🟢 **Début** — <t:${startUnix}:F> (<t:${startUnix}:R>)`);
  if (!isNaN(endUnix)) lines.push(`🔴 **Fin** — <t:${endUnix}:F> (<t:${endUnix}:R>)`);
  children.push(text(lines.join("\n") || "—"));

  children.push(sep());
  children.push(text(`-# Event ID \`${ev.event.id}\` • données : api.meonix.me`));

  return cv2([container(children, BRAWL_ACCENT)]);
}

function buildMapOverview(active: BrawlEvent[]): ReturnType<typeof cv2> {
  const children: Parameters<typeof container>[0] = [
    text("# 🌀 Brawl Stars — Rotation en cours"),
    text(
      `-# ${active.length} événement${active.length > 1 ? "s" : ""} actuellement disponible${active.length > 1 ? "s" : ""} · Sélectionne-en un ci-dessous pour voir sa map.`,
    ),
    sep(2),
    text("### 🎮 Événements actifs"),
  ];

  const shown = active.slice(0, 20);
  shown.forEach((ev, i) => {
    const endUnix = Math.floor(parseApiTime(ev.endTime).getTime() / 1000);
    const endPart = !isNaN(endUnix) ? `\n-# 🔴 se termine <t:${endUnix}:R>` : "";
    children.push(text(`**${prettyMode(ev.event.mode)}** · ${ev.event.map}${endPart}`));
    if (i < shown.length - 1) children.push(sep());
  });

  children.push(sep(2));
  children.push(text("### 🔎 Voir une map en détail"));
  children.push(
    actionRow([
      stringSelect(
        "maps_select",
        active.slice(0, 25).map((ev) => ({
          label: `${prettyMode(ev.event.mode)} — ${ev.event.map}`.slice(0, 100),
          value: String(ev.event.id),
          description: `Event #${ev.event.id}`.slice(0, 100),
        })),
        "Choisis un événement…",
      ),
    ]),
  );

  children.push(sep());
  children.push(text("-# Astuce : utilise `/maps event:<nom>` pour un accès direct avec autocomplétion."));

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
      cv2([container([
        text("# ⚠️ Brawl Stars"),
        sep(),
        text("L'API Brawl Stars est indisponible.\nRéessaie dans quelques instants."),
      ], BRAWL_ACCENT)]),
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
        cv2([container([
          text("# ❌ Événement introuvable"),
          sep(),
          text("Cet événement n'est plus en cours. Relance `/maps` pour voir la rotation à jour."),
        ], BRAWL_ACCENT)]),
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

// ─── Moderation handlers ─────────────────────────────────────────────────────

function getOpt(interaction: any, name: string): any {
  return interaction.options?.get?.(name) ?? null;
}

function getStr(interaction: any, name: string): string | null {
  try { return interaction.options?.getString?.(name) ?? null; } catch { return null; }
}
function getInt(interaction: any, name: string): number | null {
  try { return interaction.options?.getInteger?.(name) ?? null; } catch { return null; }
}
function getUser(interaction: any, name: string): { id: string; username: string; tag: string } | null {
  try {
    const u = interaction.options?.getUser?.(name);
    if (!u) return null;
    return { id: u.id, username: u.username ?? "unknown", tag: u.tag ?? u.username ?? u.id };
  } catch { return null; }
}
function getChannel(interaction: any, name: string): { id: string; name: string } | null {
  try {
    const c = interaction.options?.getChannel?.(name);
    if (!c) return null;
    return { id: c.id, name: c.name ?? "channel" };
  } catch { return null; }
}

async function handleBanCommand(interaction: any): Promise<void> {
  const guildId: string | null = interaction.guildId;
  const target = getUser(interaction, "user");
  const reason = getStr(interaction, "reason");
  const deleteDays = getInt(interaction, "delete_days") ?? 0;
  if (!guildId || !target) {
    return void (await replyInteraction(interaction.id, interaction.token, replyError("Ban impossible", "Commande utilisable uniquement dans un serveur."), true));
  }
  const moderator = { id: interaction.user.id, username: interaction.user.username };

  // DM first (user must still be in guild)
  const dm = await sendDM(target.id, dmBan(reason));

  try {
    await banUser(guildId, target.id, reason, deleteDays * 86400);
    await logModeration({
      action: "ban", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "yes",
      extra: { deleteDays },
    });
    await replyInteraction(interaction.id, interaction.token, replySuccess("🔨 Membre banni", [
      `**Membre** — <@${target.id}> (${target.tag})`,
      `**Raison** — ${reason ?? "—"}`,
      `**Messages supprimés** — ${deleteDays} jour${deleteDays > 1 ? "s" : ""}`,
      `**MP envoyé** — ${dm ? "✅" : "❌ (MP fermés)"}`,
    ], ACCENT_RED));
  } catch (err) {
    await logModeration({
      action: "ban", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "no",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await replyInteraction(interaction.id, interaction.token, replyError("Ban échoué", err instanceof Error ? err.message : "Erreur inconnue"), true);
  }
}

async function handleUnbanCommand(interaction: any): Promise<void> {
  const guildId: string | null = interaction.guildId;
  const userId = getStr(interaction, "user_id");
  const reason = getStr(interaction, "reason");
  if (!guildId || !userId) {
    return void (await replyInteraction(interaction.id, interaction.token, replyError("Unban impossible", "Arguments manquants."), true));
  }
  const moderator = { id: interaction.user.id, username: interaction.user.username };
  try {
    await unbanUser(guildId, userId, reason);
    await logModeration({
      action: "unban", guildId, targetId: userId, targetUsername: null,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: "na", success: "yes",
    });
    await replyInteraction(interaction.id, interaction.token, replySuccess("✅ Utilisateur débanni", [
      `**ID** — \`${userId}\``,
      `**Raison** — ${reason ?? "—"}`,
    ], ACCENT_GREEN));
  } catch (err) {
    await logModeration({
      action: "unban", guildId, targetId: userId, targetUsername: null,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: "na", success: "no",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await replyInteraction(interaction.id, interaction.token, replyError("Unban échoué", err instanceof Error ? err.message : "Erreur inconnue"), true);
  }
}

async function handleKickCommand(interaction: any): Promise<void> {
  const guildId: string | null = interaction.guildId;
  const target = getUser(interaction, "user");
  const reason = getStr(interaction, "reason");
  if (!guildId || !target) {
    return void (await replyInteraction(interaction.id, interaction.token, replyError("Kick impossible", "Commande utilisable uniquement dans un serveur."), true));
  }
  const moderator = { id: interaction.user.id, username: interaction.user.username };

  const dm = await sendDM(target.id, dmKick(reason));

  try {
    await kickUser(guildId, target.id, reason);
    await logModeration({
      action: "kick", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "yes",
    });
    await replyInteraction(interaction.id, interaction.token, replySuccess("👢 Membre expulsé", [
      `**Membre** — <@${target.id}> (${target.tag})`,
      `**Raison** — ${reason ?? "—"}`,
      `**MP envoyé** — ${dm ? "✅" : "❌"}`,
    ], ACCENT_ORANGE));
  } catch (err) {
    await logModeration({
      action: "kick", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "no",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await replyInteraction(interaction.id, interaction.token, replyError("Kick échoué", err instanceof Error ? err.message : "Erreur inconnue"), true);
  }
}

async function handleMuteCommand(interaction: any): Promise<void> {
  const guildId: string | null = interaction.guildId;
  const target = getUser(interaction, "user");
  const duration = getInt(interaction, "duration");
  const unit = getStr(interaction, "unit");
  const reason = getStr(interaction, "reason");
  if (!guildId || !target || !duration || !unit) {
    return void (await replyInteraction(interaction.id, interaction.token, replyError("Mute impossible", "Arguments manquants."), true));
  }
  const multipliers: Record<string, number> = { m: 60, h: 3600, d: 86400 };
  const seconds = duration * (multipliers[unit] ?? 60);
  // Discord caps timeout at 28 days
  const maxSeconds = 28 * 86400;
  const cappedSeconds = Math.min(seconds, maxSeconds);
  const untilMs = Date.now() + cappedSeconds * 1000;
  const untilIso = new Date(untilMs).toISOString();
  const untilUnix = Math.floor(untilMs / 1000);

  const moderator = { id: interaction.user.id, username: interaction.user.username };
  const dm = await sendDM(target.id, dmMute(untilUnix, reason));

  try {
    await timeoutUser(guildId, target.id, untilIso, reason);
    await logModeration({
      action: "mute", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, durationSec: String(cappedSeconds),
      dmDelivered: dm ? "yes" : "no", success: "yes",
      extra: { duration, unit, untilIso },
    });
    await replyInteraction(interaction.id, interaction.token, replySuccess("🔇 Membre muet", [
      `**Membre** — <@${target.id}> (${target.tag})`,
      `**Durée** — ${duration} ${unit === "m" ? "minute(s)" : unit === "h" ? "heure(s)" : "jour(s)"}`,
      `**Jusqu'au** — <t:${untilUnix}:F> (<t:${untilUnix}:R>)`,
      `**Raison** — ${reason ?? "—"}`,
      `**MP envoyé** — ${dm ? "✅" : "❌"}`,
    ], ACCENT_ORANGE));
  } catch (err) {
    await logModeration({
      action: "mute", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, durationSec: String(cappedSeconds),
      dmDelivered: dm ? "yes" : "no", success: "no",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await replyInteraction(interaction.id, interaction.token, replyError("Mute échoué", err instanceof Error ? err.message : "Erreur inconnue"), true);
  }
}

async function handleDemuteCommand(interaction: any): Promise<void> {
  const guildId: string | null = interaction.guildId;
  const target = getUser(interaction, "user");
  const reason = getStr(interaction, "reason");
  if (!guildId || !target) {
    return void (await replyInteraction(interaction.id, interaction.token, replyError("Démute impossible", "Arguments manquants."), true));
  }
  const moderator = { id: interaction.user.id, username: interaction.user.username };
  const dm = await sendDM(target.id, dmUnmute(reason));

  try {
    await timeoutUser(guildId, target.id, null, reason);
    await logModeration({
      action: "unmute", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "yes",
    });
    await replyInteraction(interaction.id, interaction.token, replySuccess("🔊 Mute retiré", [
      `**Membre** — <@${target.id}> (${target.tag})`,
      `**Raison** — ${reason ?? "—"}`,
      `**MP envoyé** — ${dm ? "✅" : "❌"}`,
    ], ACCENT_GREEN));
  } catch (err) {
    await logModeration({
      action: "unmute", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "no",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    await replyInteraction(interaction.id, interaction.token, replyError("Démute échoué", err instanceof Error ? err.message : "Erreur inconnue"), true);
  }
}

async function handleMoveCommand(interaction: any): Promise<void> {
  const guildId: string | null = interaction.guildId;
  const target = getUser(interaction, "user");
  const channel = getChannel(interaction, "channel");
  const reason = getStr(interaction, "reason");
  if (!guildId || !target || !channel) {
    return void (await replyInteraction(interaction.id, interaction.token, replyError("Move impossible", "Arguments manquants."), true));
  }
  const moderator = { id: interaction.user.id, username: interaction.user.username };
  const dm = await sendDM(target.id, dmMove(channel.name, reason));

  try {
    await moveUser(guildId, target.id, channel.id, reason);
    await logModeration({
      action: "move", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "yes",
      extra: { channelId: channel.id, channelName: channel.name },
    });
    await replyInteraction(interaction.id, interaction.token, replySuccess("🎧 Membre déplacé", [
      `**Membre** — <@${target.id}> (${target.tag})`,
      `**Salon** — <#${channel.id}>`,
      `**Raison** — ${reason ?? "—"}`,
      `**MP envoyé** — ${dm ? "✅" : "❌"}`,
    ], ACCENT_ORANGE));
  } catch (err) {
    await logModeration({
      action: "move", guildId, targetId: target.id, targetUsername: target.tag,
      moderatorId: moderator.id, moderatorUsername: moderator.username,
      reason, dmDelivered: dm ? "yes" : "no", success: "no",
      errorMessage: err instanceof Error ? err.message : String(err),
      extra: { channelId: channel.id, channelName: channel.name },
    });
    await replyInteraction(interaction.id, interaction.token, replyError("Move échoué", err instanceof Error ? err.message : "Erreur inconnue\n-# Le membre doit être dans un salon vocal."), true);
  }
}

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.type === InteractionType.ApplicationCommand) {
      if (interaction.commandName === "event") return void (await handleEventCommand(interaction));
      if (interaction.commandName === "maps") return void (await handleMapsCommand(interaction));
      if (interaction.commandName === "ban") return void (await handleBanCommand(interaction));
      if (interaction.commandName === "unban") return void (await handleUnbanCommand(interaction));
      if (interaction.commandName === "kick") return void (await handleKickCommand(interaction));
      if (interaction.commandName === "mute") return void (await handleMuteCommand(interaction));
      if (interaction.commandName === "demute") return void (await handleDemuteCommand(interaction));
      if (interaction.commandName === "move") return void (await handleMoveCommand(interaction));
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
