import { db, moderationLogsTable, type NewModerationLog } from "@workspace/db";
import { text, sep, container, cv2, sendCv2Message } from "../utils/cv2.js";

const DISCORD_API = "https://discord.com/api/v10";
const ACCENT_RED = 0xef4444;
const ACCENT_ORANGE = 0xf97316;
const ACCENT_GREEN = 0x22c55e;

function token(): string {
  const t = process.env.DISCORD_BOT_TOKEN;
  if (!t) throw new Error("DISCORD_BOT_TOKEN not set");
  return t;
}

async function discord<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
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
  try {
    return JSON.parse(body) as T;
  } catch {
    return undefined as T;
  }
}

// ─── DM helper ────────────────────────────────────────────────────────────────

export async function sendDM(
  userId: string,
  payload: Parameters<typeof sendCv2Message>[1],
): Promise<boolean> {
  try {
    const channel = await discord<{ id: string }>("/users/@me/channels", {
      method: "POST",
      body: JSON.stringify({ recipient_id: userId }),
    });
    await sendCv2Message(channel.id, payload, token());
    return true;
  } catch (err) {
    console.warn(`[Mod] DM to ${userId} failed:`, err);
    return false;
  }
}

// ─── Moderation actions ───────────────────────────────────────────────────────

export async function banUser(
  guildId: string,
  userId: string,
  reason: string | null,
  deleteMessageSeconds = 0,
): Promise<void> {
  await discord(`/guilds/${guildId}/bans/${userId}`, {
    method: "PUT",
    headers: reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {},
    body: JSON.stringify({ delete_message_seconds: deleteMessageSeconds }),
  });
}

export async function unbanUser(guildId: string, userId: string, reason: string | null): Promise<void> {
  await discord(`/guilds/${guildId}/bans/${userId}`, {
    method: "DELETE",
    headers: reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {},
  });
}

export async function kickUser(guildId: string, userId: string, reason: string | null): Promise<void> {
  await discord(`/guilds/${guildId}/members/${userId}`, {
    method: "DELETE",
    headers: reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {},
  });
}

export async function timeoutUser(
  guildId: string,
  userId: string,
  untilIso: string | null,
  reason: string | null,
): Promise<void> {
  await discord(`/guilds/${guildId}/members/${userId}`, {
    method: "PATCH",
    headers: reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {},
    body: JSON.stringify({ communication_disabled_until: untilIso }),
  });
}

export async function moveUser(
  guildId: string,
  userId: string,
  channelId: string,
  reason: string | null,
): Promise<void> {
  await discord(`/guilds/${guildId}/members/${userId}`, {
    method: "PATCH",
    headers: reason ? { "X-Audit-Log-Reason": encodeURIComponent(reason) } : {},
    body: JSON.stringify({ channel_id: channelId }),
  });
}

// ─── Logging ──────────────────────────────────────────────────────────────────

export async function logModeration(entry: NewModerationLog): Promise<void> {
  try {
    await db.insert(moderationLogsTable).values(entry);
  } catch (err) {
    console.error("[Mod] Failed to log moderation action:", err);
  }
}

// ─── DM templates ─────────────────────────────────────────────────────────────

const GUILD_LABEL = "VOID Esport";

export function dmBan(reason: string | null): ReturnType<typeof cv2> {
  return cv2([
    container([
      text("# 🔨 Tu as été banni"),
      sep(),
      text(`Tu as été **banni** du serveur **${GUILD_LABEL}**.`),
      text(`**Raison** — ${reason ?? "Aucune raison fournie"}`),
      sep(),
      text("-# Si tu penses qu'il s'agit d'une erreur, contacte le staff."),
    ], ACCENT_RED),
  ]);
}

export function dmKick(reason: string | null): ReturnType<typeof cv2> {
  return cv2([
    container([
      text("# 👢 Tu as été expulsé"),
      sep(),
      text(`Tu as été **expulsé** du serveur **${GUILD_LABEL}**.`),
      text(`**Raison** — ${reason ?? "Aucune raison fournie"}`),
      sep(),
      text("-# Tu peux rejoindre à nouveau via une invitation."),
    ], ACCENT_ORANGE),
  ]);
}

export function dmMute(untilUnix: number, reason: string | null): ReturnType<typeof cv2> {
  return cv2([
    container([
      text("# 🔇 Tu as été rendu muet"),
      sep(),
      text(`Tu as été **rendu muet** sur **${GUILD_LABEL}**.`),
      text(`**Raison** — ${reason ?? "Aucune raison fournie"}`),
      text(`**Jusqu'au** — <t:${untilUnix}:F> (<t:${untilUnix}:R>)`),
      sep(),
      text("-# Pendant ce temps tu ne peux ni parler ni réagir."),
    ], ACCENT_ORANGE),
  ]);
}

export function dmUnmute(reason: string | null): ReturnType<typeof cv2> {
  return cv2([
    container([
      text("# 🔊 Tu peux à nouveau parler"),
      sep(),
      text(`Ton mute sur **${GUILD_LABEL}** a été **retiré**.`),
      text(`**Raison** — ${reason ?? "Aucune raison fournie"}`),
    ], ACCENT_GREEN),
  ]);
}

export function dmMove(channelName: string, reason: string | null): ReturnType<typeof cv2> {
  return cv2([
    container([
      text("# 🎧 Tu as été déplacé"),
      sep(),
      text(`Un membre du staff t'a déplacé dans **#${channelName}** sur **${GUILD_LABEL}**.`),
      text(`**Raison** — ${reason ?? "Aucune raison fournie"}`),
    ], ACCENT_ORANGE),
  ]);
}

// ─── Interaction reply helpers ────────────────────────────────────────────────

export function replySuccess(title: string, lines: string[], color = ACCENT_GREEN): ReturnType<typeof cv2> {
  return cv2([
    container([
      text(`# ${title}`),
      sep(),
      ...lines.map((l) => text(l)),
    ], color),
  ]);
}

export function replyError(title: string, message: string): ReturnType<typeof cv2> {
  return cv2([
    container([
      text(`# ❌ ${title}`),
      sep(),
      text(message),
    ], ACCENT_RED),
  ]);
}

export { ACCENT_RED, ACCENT_ORANGE, ACCENT_GREEN };
