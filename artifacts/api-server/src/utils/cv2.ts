/**
 * Discord Components V2 — builder utilities + REST sender
 * Uses the Discord API directly (no discord.js wrappers).
 *
 * Spec: https://discord.com/developers/docs/components/reference
 * Requires flag IS_COMPONENTS_V2 (1 << 15) on every message.
 */

const DISCORD_API = "https://discord.com/api/v10";
export const IS_COMPONENTS_V2 = 1 << 15;

// ─── Component type IDs ──────────────────────────────────────────────────────

export const CType = {
  ActionRow:    1,
  Button:       2,
  TextDisplay:  10,
  MediaGallery: 12,
  Separator:    14,
  Container:    17,
} as const;

// ─── Component interfaces ────────────────────────────────────────────────────

export interface TextDisplay {
  type: 10;
  content: string;
  id?: number;
}

export interface Separator {
  type: 14;
  divider?: boolean;
  spacing?: 1 | 2; // 1 = small, 2 = large
  id?: number;
}

export interface MediaGalleryItem {
  media: { url: string };
  description?: string;
}

export interface MediaGallery {
  type: 12;
  items: MediaGalleryItem[];
  id?: number;
}

export interface Button {
  type: 2;
  style: 1 | 2 | 3 | 4 | 5; // 5 = Link
  label: string;
  url?: string;
  custom_id?: string;
  disabled?: boolean;
}

export interface ActionRow {
  type: 1;
  components: Button[];
  id?: number;
}

export type ContainerChild = TextDisplay | Separator | MediaGallery | ActionRow;

export interface Container {
  type: 17;
  components: ContainerChild[];
  accent_color?: number;
  id?: number;
}

export interface CV2Payload {
  flags: number;
  components: Container[];
  content?: string;
}

// ─── Builder helpers ─────────────────────────────────────────────────────────

export function text(content: string): TextDisplay {
  return { type: CType.TextDisplay, content };
}

export function sep(spacing: 1 | 2 = 1): Separator {
  return { type: CType.Separator, divider: true, spacing };
}

export function gallery(urls: string[]): MediaGallery {
  return {
    type: CType.MediaGallery,
    items: urls.map((url) => ({ media: { url } })),
  };
}

export function linkButton(label: string, url: string): Button {
  return { type: CType.Button, style: 5, label, url };
}

export function actionRow(buttons: Button[]): ActionRow {
  return { type: CType.ActionRow, components: buttons };
}

export function container(
  children: ContainerChild[],
  accentColor?: number,
): Container {
  return {
    type: CType.Container,
    components: children,
    ...(accentColor !== undefined ? { accent_color: accentColor } : {}),
  };
}

/** Wrap one or more containers into a ready-to-send CV2 payload. */
export function cv2(containers: Container[], content?: string): CV2Payload {
  return {
    flags: IS_COMPONENTS_V2,
    components: containers,
    ...(content ? { content } : {}),
  };
}

// ─── Discord timestamp helpers ────────────────────────────────────────────────

/** `<t:UNIX:F>` — full date/time e.g. "Monday, 20 April 2026 19:00" */
export function tsLong(date: Date | string): string {
  const unix = Math.floor(new Date(date).getTime() / 1000);
  return `<t:${unix}:F>`;
}

/** `<t:UNIX:R>` — relative e.g. "in 3 days" */
export function tsRelative(date: Date | string): string {
  const unix = Math.floor(new Date(date).getTime() / 1000);
  return `<t:${unix}:R>`;
}

// ─── REST senders ─────────────────────────────────────────────────────────────

function botHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

/** Send a CV2 message to a channel. */
export async function sendCv2Message(
  channelId: string,
  payload: CV2Payload,
  token: string,
): Promise<void> {
  const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
    method: "POST",
    headers: botHeaders(token),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API error ${res.status}: ${body}`);
  }
}

/** Reply to a slash command interaction with a CV2 message (type 4 = CHANNEL_MESSAGE_WITH_SOURCE). */
export async function replyInteraction(
  interactionId: string,
  interactionToken: string,
  payload: CV2Payload,
  ephemeral = false,
): Promise<void> {
  const flags = IS_COMPONENTS_V2 | (ephemeral ? 64 : 0);
  const body = {
    type: 4,
    data: { ...payload, flags },
  };
  const res = await fetch(
    `${DISCORD_API}/interactions/${interactionId}/${interactionToken}/callback`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Discord interaction reply error ${res.status}: ${txt}`);
  }
}

/** Register global slash commands for the application. */
export async function registerSlashCommands(
  applicationId: string,
  token: string,
  commands: object[],
): Promise<void> {
  const res = await fetch(
    `${DISCORD_API}/applications/${applicationId}/commands`,
    {
      method: "PUT",
      headers: botHeaders(token),
      body: JSON.stringify(commands),
    },
  );
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to register commands ${res.status}: ${txt}`);
  }
  console.log("[CV2] Slash commands registered.");
}
