import sharp from "sharp";

export interface CardEvent {
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

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function wrapTitle(text: string): [string, string | null] {
  const max = 28;
  if (text.length <= max) return [text, null];
  const words = text.split(" ");
  let line1 = "";
  let line2 = "";
  let fillingLine2 = false;
  for (const w of words) {
    if (!fillingLine2 && (line1 + " " + w).trim().length <= max) {
      line1 = (line1 + " " + w).trim();
    } else {
      fillingLine2 = true;
      line2 = (line2 + " " + w).trim();
    }
  }
  return [line1, truncate(line2, max + 2)];
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const tz = "Europe/Paris";
  const date = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", timeZone: tz });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  return `${date} à ${time}`;
}

async function fetchImageAsBase64(url: string): Promise<{ b64: string; mime: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const mime = contentType.split(";")[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    const b64 = buf.toString("base64");
    return { b64, mime };
  } catch {
    return null;
  }
}

export async function generateMatcherinoCard(event: CardEvent): Promise<Buffer> {
  const W = 1200;
  const H = 630;

  const img = event.heroImg ? await fetchImageAsBase64(event.heroImg) : null;
  const imgTag = img
    ? `<image href="data:${img.mime};base64,${img.b64}" x="540" y="0" width="660" height="${H}" preserveAspectRatio="xMidYMid slice"/>`
    : "";

  const [titleL1, titleL2] = wrapTitle(event.title);
  const dateStr = event.startAt ? formatDate(event.startAt) : "Date à définir";
  const endStr = event.endAt ? ` → ${formatDate(event.endAt)}` : "";
  const game = event.gameTitle ? truncate(event.gameTitle, 24) : null;

  const prizeTag =
    event.totalBalance > 0
      ? `<text x="80" y="495" font-family="monospace" font-size="13" fill="#8b5cf6cc" letter-spacing="3">PRIZE POOL</text>
         <text x="80" y="522" font-family="monospace" font-weight="bold" font-size="26" fill="#a78bfa">$${event.totalBalance}</text>`
      : "";

  const testBanner = event.isTest
    ? `<rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#eab308" stroke-width="6"/>
       <rect x="0" y="0" width="200" height="34" fill="#eab308"/>
       <text x="10" y="22" font-family="monospace" font-weight="bold" font-size="13" fill="#000" letter-spacing="3">TEST — IGNORE</text>`
    : "";

  const gameTagWidth = game ? game.length * 8.5 + 26 : 0;
  const gameTag = game
    ? `<rect x="80" y="305" width="${gameTagWidth}" height="30" fill="#1a0f2e" stroke="#8b5cf6" stroke-width="1.5" rx="2"/>
       <text x="93" y="325" font-family="monospace" font-size="12" fill="#c4b5fd" letter-spacing="3">${escapeXml(game.toUpperCase())}</text>`
    : "";

  const svg = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff07" stroke-width="1"/>
    </pattern>
    <linearGradient id="bgGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.12"/>
      <stop offset="60%" stop-color="#0a0a0e" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="imgFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0a0a0e" stop-opacity="1"/>
      <stop offset="25%" stop-color="#0a0a0e" stop-opacity="0.65"/>
      <stop offset="55%" stop-color="#0a0a0e" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="#0a0a0e" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a0a0e" stop-opacity="0"/>
      <stop offset="100%" stop-color="#0a0a0e" stop-opacity="0.85"/>
    </linearGradient>
    <clipPath id="imgClip">
      <rect x="540" y="0" width="660" height="${H}"/>
    </clipPath>
  </defs>

  <!-- Base background -->
  <rect width="${W}" height="${H}" fill="#0a0a0e"/>

  <!-- Tournament image (right side) -->
  <g clip-path="url(#imgClip)">
    ${imgTag}
  </g>

  <!-- Grid -->
  <rect width="${W}" height="${H}" fill="url(#grid)"/>

  <!-- Glow from top-left -->
  <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>

  <!-- Fade left panel over image -->
  <rect x="540" y="0" width="660" height="${H}" fill="url(#imgFade)"/>

  <!-- Bottom darkening -->
  <rect width="${W}" height="${H}" fill="url(#bottomFade)"/>

  <!-- Left border accent line -->
  <rect x="0" y="0" width="4" height="${H}" fill="#8b5cf6"/>
  <rect x="4" y="0" width="60" height="${H}" fill="#8b5cf608"/>

  <!-- Top purple bar -->
  <rect x="0" y="0" width="${W}" height="3" fill="#8b5cf6"/>

  <!-- Void label -->
  <text x="80" y="76" font-family="monospace" font-size="11" fill="#8b5cf6cc" letter-spacing="5">VOID ESPORT</text>
  <text x="192" y="76" font-family="monospace" font-size="11" fill="#ffffff70" letter-spacing="5">· MATCHERINO</text>

  <!-- Separator line under label -->
  <line x1="80" y1="88" x2="480" y2="88" stroke="#8b5cf640" stroke-width="1"/>

  <!-- Tournament ID (small, above title) -->
  <text x="80" y="140" font-family="monospace" font-size="12" fill="#8b5cf6cc" letter-spacing="4">#${event.id}</text>

  <!-- Title line 1 -->
  <text x="80" y="215" font-family="sans-serif" font-weight="bold" font-size="48" fill="white">${escapeXml(titleL1)}</text>
  ${titleL2
    ? `<text x="80" y="267" font-family="sans-serif" font-weight="bold" font-size="48" fill="white">${escapeXml(titleL2)}</text>`
    : ""}

  <!-- Game badge -->
  ${gameTag}

  <!-- Date row -->
  <text x="80" y="${titleL2 ? 395 : 360}" font-family="monospace" font-size="12" fill="#8b5cf6cc" letter-spacing="3">DATE</text>
  <text x="80" y="${titleL2 ? 422 : 387}" font-family="monospace" font-size="18" fill="#ffffffee">${escapeXml(dateStr + endStr)}</text>

  <!-- Participants -->
  <text x="${event.totalBalance > 0 ? 300 : 80}" y="495" font-family="monospace" font-size="13" fill="#8b5cf6cc" letter-spacing="3">PARTICIPANTS</text>
  <text x="${event.totalBalance > 0 ? 300 : 80}" y="522" font-family="monospace" font-weight="bold" font-size="26" fill="white">${event.participantsCount}</text>

  <!-- Prize pool (if any) -->
  ${prizeTag}

  <!-- Bottom bar -->
  <rect x="0" y="${H - 56}" width="${W}" height="56" fill="#0d0d12"/>
  <rect x="0" y="${H - 56}" width="${W}" height="1" fill="#8b5cf630"/>

  <!-- Bottom left: direct event link -->
  <text x="80" y="${H - 22}" font-family="monospace" font-size="12" fill="#8b5cf6aa" letter-spacing="2">void.meonix.me/matcherino/${event.id}</text>

  <!-- Bottom right: site branding -->
  <text x="${W - 80}" y="${H - 22}" font-family="monospace" font-size="13" font-weight="bold" fill="#ffffffcc" letter-spacing="3" text-anchor="end">void.meonix.me</text>

  <!-- Test banner (on top of everything) -->
  ${testBanner}
</svg>`.trim();

  // Render at 4x density (288 DPI vs default 72) for crisp text/lines,
  // then downscale with lanczos3 for maximum sharpness. Output as
  // lossless PNG with max compression.
  return sharp(Buffer.from(svg), { density: 288 })
    .resize(W, H, { kernel: "lanczos3", fit: "fill" })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
    })
    .toBuffer();
}
