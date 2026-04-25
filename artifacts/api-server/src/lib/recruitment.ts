/**
 * VOID Esport — Recruitment ticket system.
 *
 * Flow:
 *  1. Staff posts the panel in a channel via /api/staff/recruitment/panel
 *  2. Candidate selects a division → bot creates a private ticket channel
 *  3. Bot asks questions one by one. After each answer:
 *      - bot deletes its own previous question and the candidate's reply
 *      - saves the answer in DB
 *      - posts the next question (and stores its message id)
 *  4. Tag step: bot looks up the BS profile via Meonix and asks for confirmation
 *  5. Once finished, the channel is locked and the application appears in the
 *     staff panel. Staff updates the status from the website → DM is sent.
 */

import { db, recruitmentApplicationsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import {
  text, sep, container, cv2, actionRow, stringSelect,
  IS_COMPONENTS_V2,
  type CV2Payload,
} from "../utils/cv2.js";
import { sendDM } from "./moderation.js";

const DISCORD_API = "https://discord.com/api/v10";
export const STAFF_ROLE_ID = "1496764424118075472";
export const TICKET_CATEGORY_ID = "1496764571086622811";

const ACCENT_VOID = 0x8b5cf6;
const ACCENT_GREEN = 0x22c55e;
const ACCENT_RED = 0xef4444;
const ACCENT_YELLOW = 0xf59e0b;

// Discord permission bits (BigInt strings for Discord API)
const PERM_VIEW_CHANNEL = 1n << 10n;
const PERM_SEND_MESSAGES = 1n << 11n;
const PERM_READ_MESSAGE_HISTORY = 1n << 16n;
const PERM_ATTACH_FILES = 1n << 15n;
const PERM_EMBED_LINKS = 1n << 14n;
const PERM_MANAGE_MESSAGES = 1n << 13n;

const TICKET_DENY = String(PERM_VIEW_CHANNEL);
const TICKET_ALLOW = String(
  PERM_VIEW_CHANNEL |
    PERM_SEND_MESSAGES |
    PERM_READ_MESSAGE_HISTORY |
    PERM_ATTACH_FILES |
    PERM_EMBED_LINKS,
);
const TICKET_ALLOW_STAFF = String(
  PERM_VIEW_CHANNEL |
    PERM_SEND_MESSAGES |
    PERM_READ_MESSAGE_HISTORY |
    PERM_ATTACH_FILES |
    PERM_EMBED_LINKS |
    PERM_MANAGE_MESSAGES,
);

// ─── Divisions ────────────────────────────────────────────────────────────────

export type Division = "alpha" | "omega" | "nexus";

export const DIVISIONS: Record<Division, { label: string; rank: string; description: string }> = {
  alpha: { label: "Alpha",  rank: "Master",       description: "Division compétitive — niveau Master requis" },
  omega: { label: "Omega",  rank: "Légendaire 2", description: "Division avancée — Légendaire 2 minimum" },
  nexus: { label: "Nexus",  rank: "Mythique 2",   description: "Division d'entrée — Mythique 2 minimum" },
};

// ─── Discord REST helper ──────────────────────────────────────────────────────

function token(): string {
  const t = process.env.DISCORD_BOT_TOKEN;
  if (!t) throw new Error("DISCORD_BOT_TOKEN not set");
  return t;
}

async function discord<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Discord ${res.status}: ${body}`);
  }
  try { return JSON.parse(body) as T; } catch { return undefined as T; }
}

/** Send a CV2 message and return its message id. */
async function sendAndGetId(channelId: string, payload: CV2Payload): Promise<string> {
  const msg = await discord<{ id: string }>(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ ...payload, flags: payload.flags | IS_COMPONENTS_V2 }),
  });
  return msg.id;
}

async function deleteMessage(channelId: string, messageId: string): Promise<void> {
  try {
    await discord(`/channels/${channelId}/messages/${messageId}`, { method: "DELETE" });
  } catch (err) {
    console.warn(`[Recruitment] delete message failed: ${err}`);
  }
}

// ─── Panel (staff sends this to a channel) ────────────────────────────────────

export function buildPanel(): CV2Payload {
  const lines: string[] = [
    "# Recrutement VOID Esport",
    "",
    "Sélectionne ta division ci-dessous selon ton **niveau ranked actuel**.",
    "Un salon privé sera créé pour ta candidature.",
    "",
    "**Alpha** — Master",
    "**Omega** — Légendaire 2",
    "**Nexus** — Mythique 2",
    "",
    "-# Une seule candidature en cours par membre.",
  ];
  return cv2([
    container([
      text(lines.join("\n")),
      sep(),
      actionRow([
        stringSelect(
          "recruitment_division",
          (Object.keys(DIVISIONS) as Division[]).map((key) => ({
            label: DIVISIONS[key].label,
            value: key,
            description: DIVISIONS[key].description,
          })),
          "Choisis ta division…",
        ),
      ]),
    ], ACCENT_VOID),
  ]);
}

export async function sendPanel(channelId: string): Promise<{ messageId: string }> {
  const id = await sendAndGetId(channelId, buildPanel());
  return { messageId: id };
}

// ─── Ticket creation (on division select) ─────────────────────────────────────

interface CreateChannelArgs {
  guildId: string;
  userId: string;
  username: string;
  division: Division;
}

async function createTicketChannel(args: CreateChannelArgs): Promise<{ id: string }> {
  const safeUser = args.username.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20) || "user";
  const name = `${args.division}-${safeUser}`;
  return discord<{ id: string }>(`/guilds/${args.guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name,
      type: 0, // GUILD_TEXT
      parent_id: TICKET_CATEGORY_ID,
      topic: `Candidature ${DIVISIONS[args.division].label} — <@${args.userId}>`,
      permission_overwrites: [
        { id: args.guildId,    type: 0, deny:  TICKET_DENY,        allow: "0" },
        { id: args.userId,     type: 1, allow: TICKET_ALLOW,       deny:  "0" },
        { id: STAFF_ROLE_ID,   type: 0, allow: TICKET_ALLOW_STAFF, deny:  "0" },
      ],
    }),
  });
}

// ─── Question builders ────────────────────────────────────────────────────────

const QUESTIONS: Record<string, { title: string; body: string }> = {
  tag: {
    title: "Étape 1/6 — Ton tag Brawl Stars",
    body: "Envoie ton **tag Brawl Stars** (avec ou sans `#`).\nExemple : `#2YJUL2L9V` ou `2YJUL2L9V`.",
  },
  trophies: {
    title: "Étape 2/6 — Trophées",
    body: "Combien de **trophées totaux** as-tu actuellement ?\nÉcris simplement le nombre, par ex. `45000`.",
  },
  ranked: {
    title: "Étape 3/6 — Ranked maximal",
    body: "Quel est ton **ranked maximal** atteint sur Brawl Stars ?\nEx : `Légendaire 1`, `Mythique 3`, `Master`…",
  },
  playtime: {
    title: "Étape 4/6 — Temps de jeu",
    body: "Combien de **temps de jeu** consacres-tu à Brawl Stars ?\nEx : `2h par jour`, `~15h par semaine`, `tous les soirs`…",
  },
  ambitions: {
    title: "Étape 5/6 — Ambitions",
    body: "Quelles sont tes **ambitions au sein de VOID** ?\nCompétition, scrims, événements, contenu… raconte.",
  },
  motivation: {
    title: "Étape 6/6 — Pourquoi toi ?",
    body: "**Pourquoi devrions-nous te choisir** plutôt qu'un autre candidat ?\nQu'est-ce qui te rend différent ?",
  },
};

function buildQuestion(stepKey: string, division: Division): CV2Payload {
  const q = QUESTIONS[stepKey];
  return cv2([
    container([
      text(`# ${q.title}`),
      text(`-# Division **${DIVISIONS[division].label}**`),
      sep(),
      text(q.body),
    ], ACCENT_VOID),
  ]);
}

function buildWelcome(userId: string, division: Division): CV2Payload {
  return cv2([
    container([
      text(`# Bienvenue, <@${userId}>`),
      text(`Tu postules pour la division **${DIVISIONS[division].label}** (${DIVISIONS[division].rank}).`),
      sep(),
      text("Réponds simplement aux questions ci-dessous. Une question à la fois.\nSi tu te trompes, recommence depuis le début en fermant ce ticket et en relançant la procédure."),
    ], ACCENT_VOID),
  ]);
}

function buildTagConfirm(brawl: { name: string; tag: string; trophies: number; iconUrl?: string | null; ranked?: string | null }): CV2Payload {
  const lines = [
    "# Confirme ton profil",
    "",
    `**Pseudo** — ${brawl.name}`,
    `**Tag** — \`${brawl.tag}\``,
    `**Trophées** — ${brawl.trophies.toLocaleString("fr-FR")}`,
  ];
  if (brawl.ranked) lines.push(`**Ranked** — ${brawl.ranked}`);
  if (brawl.iconUrl) lines.push("", `[Icône](${brawl.iconUrl})`);
  lines.push("", "Est-ce bien ton compte ?");
  return {
    flags: IS_COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_VOID,
        components: [
          { type: 10, content: lines.join("\n") },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 1,
            components: [
              { type: 2, style: 3, label: "Oui c'est moi", custom_id: "recruitment_tag_yes" },
              { type: 2, style: 4, label: "Non, retaper",  custom_id: "recruitment_tag_no"  },
            ],
          },
        ],
      } as any,
    ],
  };
}

function buildSubmitted(): CV2Payload {
  return cv2([
    container([
      text("# Candidature envoyée"),
      sep(),
      text("Merci ! Ta candidature a été transmise au staff.\nTu recevras un **message privé** dès qu'une décision sera prise.\n\nCe ticket est maintenant fermé en écriture."),
    ], ACCENT_GREEN),
  ]);
}

function buildReview(args: {
  division: Division;
  brawlName: string | null;
  brawlTag: string | null;
  brawlIconUrl: string | null;
  brawlTrophies: number | null;
  trophies: string | null;
  ranked: string | null;
  playTime: string | null;
  ambitions: string | null;
  motivation: string | null;
}): CV2Payload {
  const lines: string[] = [
    "# Vérifie ta candidature",
    "",
    `**Division** — ${DIVISIONS[args.division].label} (${DIVISIONS[args.division].rank})`,
    "",
    "**Profil Brawl Stars**",
    `• Pseudo — ${args.brawlName ?? "—"}`,
    `• Tag — \`${args.brawlTag ?? "—"}\``,
    `• Trophées API — ${args.brawlTrophies?.toLocaleString("fr-FR") ?? "—"}`,
    "",
    "**Tes réponses**",
    `• Trophées déclarés — ${args.trophies ?? "—"}`,
    `• Ranked maximal — ${args.ranked ?? "—"}`,
    `• Temps de jeu — ${args.playTime ?? "—"}`,
    "",
    "**Ambitions**",
    args.ambitions ?? "—",
    "",
    "**Pourquoi toi ?**",
    args.motivation ?? "—",
    "",
    "Si tout est correct, clique sur **Confirmer ma candidature** ci-dessous.",
  ];
  if (args.brawlIconUrl) {
    lines.splice(5, 0, `[Icône](${args.brawlIconUrl})`, "");
  }
  return {
    flags: IS_COMPONENTS_V2,
    components: [
      {
        type: 17,
        accent_color: ACCENT_VOID,
        components: [
          { type: 10, content: lines.join("\n") },
          { type: 14, divider: true, spacing: 1 },
          {
            type: 1,
            components: [
              { type: 2, style: 3, label: "Confirmer ma candidature", custom_id: "recruitment_review_confirm" },
              { type: 2, style: 4, label: "Annuler ma candidature", custom_id: "recruitment_review_cancel" },
            ],
          },
        ],
      } as any,
    ],
  };
}

function buildError(msg: string): CV2Payload {
  return cv2([container([text(`❌ ${msg}`)], ACCENT_RED)]);
}

// ─── Meonix lookup ────────────────────────────────────────────────────────────

interface BrawlProfile {
  name: string;
  tag: string;
  trophies: number;
  iconId: number | null;
  iconUrl: string | null;
  ranked: string | null;
}

/** Extract a human-readable ranked label from the raw player object. */
function extractRanked(player: any): string | null {
  if (!player) return null;

  // Direct string fields
  for (const key of ["rankedTier", "rankedRank", "rankedLabel"]) {
    const v = player[key];
    if (typeof v === "string" && v.trim()) return formatRanked(v);
  }

  // Object shapes: { tier, division? } / { name, division? }
  for (const key of ["ranked", "soloRanked", "currentRanked", "rankedSeason"]) {
    const node = player[key];
    if (!node) continue;
    if (typeof node === "string" && node.trim()) return formatRanked(node);
    if (typeof node === "object") {
      const tier = node.tier ?? node.name ?? node.label ?? node.rank;
      const division = node.division ?? node.subTier ?? node.level;
      if (typeof tier === "string" && tier.trim()) {
        return division != null ? `${formatRanked(tier)} ${division}` : formatRanked(tier);
      }
    }
  }

  return null;
}

/** Normalise tier strings like "LEGENDARY_2" → "Légendaire 2". */
function formatRanked(raw: string): string {
  const map: Record<string, string> = {
    BRONZE: "Bronze",
    SILVER: "Argent",
    GOLD: "Or",
    DIAMOND: "Diamant",
    MYTHIC: "Mythique",
    MYTHICAL: "Mythique",
    LEGENDARY: "Légendaire",
    MASTERS: "Master",
    MASTER: "Master",
    PRO: "Pro",
  };
  // Split on _ or whitespace
  const parts = raw.trim().split(/[\s_]+/);
  return parts
    .map((p) => {
      const upper = p.toUpperCase();
      if (map[upper]) return map[upper];
      // Numeric or unknown — keep as-is (capitalized)
      return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
    })
    .join(" ");
}

async function lookupBrawl(rawTag: string): Promise<BrawlProfile | null> {
  const tag = rawTag.startsWith("#") ? rawTag : `#${rawTag}`;
  const encoded = encodeURIComponent(tag);
  try {
    const res = await fetch(`https://api.meonix.me/api/player/${encoded}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json() as { player?: any };
    const p = data.player;
    if (!p || typeof p.name !== "string" || typeof p.tag !== "string") return null;
    return {
      name: p.name,
      tag: p.tag,
      trophies: Number(p.trophies ?? 0),
      iconId: typeof p.icon?.id === "number" ? p.icon.id : null,
      iconUrl: typeof p.icon?.url === "string" ? p.icon.url : null,
      ranked: extractRanked(p),
    };
  } catch {
    return null;
  }
}

// ─── Channel lock on submission ───────────────────────────────────────────────

async function lockChannel(channelId: string, userId: string): Promise<void> {
  try {
    // Override the user permission to remove SEND_MESSAGES
    await discord(`/channels/${channelId}/permissions/${userId}`, {
      method: "PUT",
      body: JSON.stringify({
        type: 1,
        allow: String(PERM_VIEW_CHANNEL | PERM_READ_MESSAGE_HISTORY),
        deny: String(PERM_SEND_MESSAGES),
      }),
    });
  } catch (err) {
    console.warn("[Recruitment] lockChannel failed:", err);
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

async function getAppByChannel(channelId: string) {
  const rows = await db.select().from(recruitmentApplicationsTable).where(
    eq(recruitmentApplicationsTable.channelId, channelId),
  );
  return rows[0] ?? null;
}

async function getOpenAppByDiscordId(discordId: string) {
  const rows = await db.select().from(recruitmentApplicationsTable).where(
    and(
      eq(recruitmentApplicationsTable.discordId, discordId),
      eq(recruitmentApplicationsTable.status, "draft"),
    ),
  );
  return rows[0] ?? null;
}

// ─── Public handlers (called from bot.ts) ─────────────────────────────────────

/**
 * Handle the division select menu interaction.
 * The interaction has already been deferred or will be replied to here.
 */
export async function handleDivisionSelect(interaction: any): Promise<void> {
  const division = (interaction.values?.[0] ?? "") as Division;
  if (!DIVISIONS[division]) {
    return ephemeralReply(interaction, buildError("Division invalide."));
  }
  const guildId: string | null = interaction.guildId;
  const userId: string = interaction.user.id;
  const username: string = interaction.user.username;
  if (!guildId) {
    return ephemeralReply(interaction, buildError("Cette action doit être effectuée dans un serveur."));
  }

  // Check for an existing open application
  const existing = await getOpenAppByDiscordId(userId);
  if (existing) {
    return ephemeralReply(interaction, cv2([container([
      text("# Tu as déjà une candidature en cours"),
      sep(),
      text(`Termine d'abord ton ticket existant : <#${existing.channelId}>`),
    ], ACCENT_YELLOW)]));
  }

  // Acknowledge interaction quickly so the select menu resets
  await ackInteraction(interaction);

  let channel: { id: string };
  try {
    channel = await createTicketChannel({ guildId, userId, username, division });
  } catch (err) {
    console.error("[Recruitment] create channel failed:", err);
    return followup(interaction, buildError("Impossible de créer ton ticket. Le bot a-t-il la permission `Manage Channels` ?"), true);
  }

  // Welcome + first question
  await sendAndGetId(channel.id, buildWelcome(userId, division));
  const firstId = await sendAndGetId(channel.id, buildQuestion("tag", division));

  await db.insert(recruitmentApplicationsTable).values({
    discordId: userId,
    discordUsername: username,
    guildId,
    channelId: channel.id,
    division,
    step: "tag",
    lastBotMessageId: firstId,
    status: "draft",
  });

  await followup(interaction, cv2([container([
    text(`✅ Ton ticket est ouvert : <#${channel.id}>`),
  ], ACCENT_GREEN)]), true);
}

/** Handle a candidate's text message inside their ticket channel. */
export async function handleTicketMessage(message: {
  id: string;
  channelId: string;
  author: { id: string; bot: boolean };
  content: string;
}): Promise<void> {
  if (message.author.bot) return;

  const app = await getAppByChannel(message.channelId);
  if (!app) return;
  if (app.discordId !== message.author.id) return;
  if (app.status !== "draft") return;

  const content = message.content.trim();
  if (!content) return;

  const division = app.division as Division;

  // Helper: delete user msg + previous bot question
  const cleanup = async () => {
    if (app.lastBotMessageId) await deleteMessage(app.channelId, app.lastBotMessageId);
    await deleteMessage(app.channelId, message.id);
  };

  // ── Step: tag ───────────────────────────────────────────────────────────────
  if (app.step === "tag") {
    const cleanTag = content.replace(/^#/, "").toUpperCase();
    if (!/^[0-9A-Z]{4,}$/.test(cleanTag)) {
      await deleteMessage(app.channelId, message.id);
      const id = await sendAndGetId(app.channelId, buildError(
        "Tag invalide. Envoie un tag Brawl Stars valide, par ex. `#2YJUL2L9V`.",
      ));
      // Replace the previous question reference with the error so it is cleaned next time
      await db.update(recruitmentApplicationsTable)
        .set({ lastBotMessageId: id, updatedAt: new Date() })
        .where(eq(recruitmentApplicationsTable.id, app.id));
      return;
    }

    const profile = await lookupBrawl(cleanTag);
    if (!profile) {
      await deleteMessage(app.channelId, message.id);
      const id = await sendAndGetId(app.channelId, buildError(
        `Aucun joueur trouvé pour le tag \`#${cleanTag}\`. Vérifie ton tag et réessaie.`,
      ));
      await db.update(recruitmentApplicationsTable)
        .set({ lastBotMessageId: id, updatedAt: new Date() })
        .where(eq(recruitmentApplicationsTable.id, app.id));
      return;
    }

    await cleanup();
    const id = await sendAndGetId(app.channelId, buildTagConfirm({
      name: profile.name,
      tag: profile.tag,
      trophies: profile.trophies,
      iconUrl: profile.iconUrl,
      ranked: profile.ranked,
    }));
    await db.update(recruitmentApplicationsTable)
      .set({
        step: "tag_confirm",
        brawlTag: profile.tag,
        brawlName: profile.name,
        brawlTrophies: profile.trophies,
        brawlIconId: profile.iconId,
        brawlIconUrl: profile.iconUrl,
        lastBotMessageId: id,
        updatedAt: new Date(),
      })
      .where(eq(recruitmentApplicationsTable.id, app.id));
    return;
  }

  // ── tag_confirm: ignore plain text, the user must click a button ───────────
  if (app.step === "tag_confirm") {
    await deleteMessage(app.channelId, message.id);
    return;
  }

  // ── Free-text steps ────────────────────────────────────────────────────────
  const next: Record<string, { col: keyof typeof recruitmentApplicationsTable["_"]["columns"]; nextStep: string | null }> = {
    trophies:   { col: "trophies",   nextStep: "ranked" },
    ranked:     { col: "ranked",     nextStep: "playtime" },
    playtime:   { col: "playTime",   nextStep: "ambitions" },
    ambitions:  { col: "ambitions",  nextStep: "motivation" },
    motivation: { col: "motivation", nextStep: "review" },
  };

  const cur = next[app.step];
  if (!cur) return;

  if (content.length > 1500) {
    await deleteMessage(app.channelId, message.id);
    const id = await sendAndGetId(app.channelId, buildError("Réponse trop longue (max 1500 caractères). Réessaie."));
    await db.update(recruitmentApplicationsTable)
      .set({ lastBotMessageId: id, updatedAt: new Date() })
      .where(eq(recruitmentApplicationsTable.id, app.id));
    return;
  }

  await cleanup();

  const update: Record<string, unknown> = {
    [cur.col]: content,
    updatedAt: new Date(),
  };

  if (cur.nextStep === "review") {
    // Last text answer (motivation) collected → show recap with confirm button.
    // All other answers were saved in earlier turns and live on `app`.
    const recap = buildReview({
      division,
      brawlName: app.brawlName,
      brawlTag: app.brawlTag,
      brawlIconUrl: app.brawlIconUrl,
      brawlTrophies: app.brawlTrophies,
      trophies: app.trophies,
      ranked: app.ranked,
      playTime: app.playTime,
      ambitions: app.ambitions,
      motivation: content,
    });
    const id = await sendAndGetId(app.channelId, recap);
    update.step = "review";
    update.lastBotMessageId = id;
    await db.update(recruitmentApplicationsTable)
      .set(update)
      .where(eq(recruitmentApplicationsTable.id, app.id));
    return;
  }

  const id = await sendAndGetId(app.channelId, buildQuestion(cur.nextStep!, division));
  update.step = cur.nextStep!;
  update.lastBotMessageId = id;
  await db.update(recruitmentApplicationsTable)
    .set(update)
    .where(eq(recruitmentApplicationsTable.id, app.id));
}

/** Handle "Oui c'est moi" / "Non, retaper" buttons. */
export async function handleTagConfirmButton(interaction: any, value: "yes" | "no"): Promise<void> {
  const app = await getAppByChannel(interaction.channelId);
  if (!app || app.status !== "draft" || app.step !== "tag_confirm") {
    return ephemeralReply(interaction, buildError("Cette confirmation n'est plus active."));
  }
  if (app.discordId !== interaction.user.id) {
    return ephemeralReply(interaction, buildError("Seul le candidat peut confirmer."));
  }

  await ackInteraction(interaction);

  if (app.lastBotMessageId) {
    await deleteMessage(app.channelId, app.lastBotMessageId);
  }

  if (value === "no") {
    const id = await sendAndGetId(app.channelId, buildQuestion("tag", app.division as Division));
    await db.update(recruitmentApplicationsTable)
      .set({
        step: "tag",
        brawlTag: null, brawlName: null, brawlTrophies: null,
        brawlIconId: null, brawlIconUrl: null, ranked: null,
        lastBotMessageId: id,
        updatedAt: new Date(),
      })
      .where(eq(recruitmentApplicationsTable.id, app.id));
    return;
  }

  // yes → next question
  const id = await sendAndGetId(app.channelId, buildQuestion("trophies", app.division as Division));
  await db.update(recruitmentApplicationsTable)
    .set({ step: "trophies", lastBotMessageId: id, updatedAt: new Date() })
    .where(eq(recruitmentApplicationsTable.id, app.id));
}

/** Handle "Confirmer ma candidature" button on the review recap. */
export async function handleReviewConfirmButton(interaction: any): Promise<void> {
  const app = await getAppByChannel(interaction.channelId);
  if (!app || app.status !== "draft" || app.step !== "review") {
    return ephemeralReply(interaction, buildError("Cette candidature n'est plus en attente de confirmation."));
  }
  if (app.discordId !== interaction.user.id) {
    return ephemeralReply(interaction, buildError("Seul le candidat peut confirmer sa candidature."));
  }

  await ackInteraction(interaction);

  // Remove the recap message with its button
  if (app.lastBotMessageId) {
    await deleteMessage(app.channelId, app.lastBotMessageId);
  }

  await db.update(recruitmentApplicationsTable)
    .set({
      step: "done",
      status: "pending",
      submittedAt: new Date(),
      lastBotMessageId: null,
      updatedAt: new Date(),
    })
    .where(eq(recruitmentApplicationsTable.id, app.id));

  await sendAndGetId(app.channelId, buildSubmitted());
  await lockChannel(app.channelId, app.discordId);

  // DM the candidate to confirm reception
  await sendDM(app.discordId, cv2([
    container([
      text("# ✅ Candidature reçue"),
      sep(),
      text(`Bonjour <@${app.discordId}>,\n\nVotre candidature pour la division **${DIVISIONS[app.division as Division]?.label ?? app.division}** **a bien été prise en compte**.\n\nLe staff l'examinera dans les meilleurs délais et tu recevras un message privé dès qu'une décision sera prise.`),
    ], ACCENT_GREEN),
  ]));
}

/** Handle "Annuler ma candidature" button on the review recap. */
export async function handleReviewCancelButton(interaction: any): Promise<void> {
  const app = await getAppByChannel(interaction.channelId);
  if (!app || app.status !== "draft" || app.step !== "review") {
    return ephemeralReply(interaction, buildError("Cette candidature ne peut plus être annulée."));
  }
  if (app.discordId !== interaction.user.id) {
    return ephemeralReply(interaction, buildError("Seul le candidat peut annuler sa candidature."));
  }

  await ackInteraction(interaction);

  // DM the candidate to confirm cancellation (best-effort, before deleting the channel)
  await sendDM(app.discordId, cv2([
    container([
      text("# Candidature annulée"),
      sep(),
      text(`Bonjour <@${app.discordId}>,\n\nTa candidature pour la division **${DIVISIONS[app.division as Division]?.label ?? app.division}** a bien été **annulée**.\n\nTu peux relancer une nouvelle candidature à tout moment depuis le salon de recrutement.`),
    ], ACCENT_RED),
  ]));

  // Remove the DB row so the candidate can open a fresh ticket
  await db.delete(recruitmentApplicationsTable)
    .where(eq(recruitmentApplicationsTable.id, app.id));

  // Delete the ticket channel
  try {
    await discord(`/channels/${app.channelId}`, { method: "DELETE" });
  } catch (err) {
    console.warn("[Recruitment] cancel: channel delete failed:", err);
  }
}

// ─── Status update from staff panel → DM the candidate ────────────────────────

export async function notifyStatusChange(
  app: typeof recruitmentApplicationsTable.$inferSelect,
  newStatus: "accepted" | "refused" | "on_hold",
  staffNote: string | null,
): Promise<boolean> {
  let title = "";
  let accent = ACCENT_VOID;
  let body = "";
  if (newStatus === "accepted") {
    title = "🎉 Candidature acceptée";
    accent = ACCENT_GREEN;
    body = `Félicitations ! Ta candidature pour la division **${DIVISIONS[app.division as Division]?.label ?? app.division}** a été **acceptée**.\nLe staff te contactera prochainement.`;
  } else if (newStatus === "refused") {
    title = "Candidature refusée";
    accent = ACCENT_RED;
    body = `Ta candidature pour la division **${DIVISIONS[app.division as Division]?.label ?? app.division}** n'a pas été retenue cette fois.\nN'hésite pas à retenter ta chance plus tard.`;
  } else {
    title = "Candidature en attente";
    accent = ACCENT_YELLOW;
    body = `Ta candidature pour la division **${DIVISIONS[app.division as Division]?.label ?? app.division}** est mise **en attente** par le staff.`;
  }
  const children: any[] = [text(`# ${title}`), sep(), text(body)];
  if (staffNote && staffNote.trim()) {
    children.push(sep());
    children.push(text(`**Message du staff** :\n${staffNote.trim()}`));
  }
  return await sendDM(app.discordId, cv2([container(children, accent)]));
}

// ─── Tiny interaction helpers (REST, no discord.js wrappers) ──────────────────

async function ackInteraction(interaction: any): Promise<void> {
  try {
    await fetch(`${DISCORD_API}/interactions/${interaction.id}/${interaction.token}/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: 6 }), // DEFERRED_UPDATE_MESSAGE
    });
  } catch (err) {
    console.warn("[Recruitment] ack failed:", err);
  }
}

async function ephemeralReply(interaction: any, payload: CV2Payload): Promise<void> {
  await fetch(`${DISCORD_API}/interactions/${interaction.id}/${interaction.token}/callback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: 4,
      data: { ...payload, flags: payload.flags | 64 },
    }),
  });
}

async function followup(interaction: any, payload: CV2Payload, ephemeral: boolean): Promise<void> {
  const flags = payload.flags | (ephemeral ? 64 : 0);
  await fetch(`${DISCORD_API}/webhooks/${interaction.applicationId}/${interaction.token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, flags }),
  });
}
