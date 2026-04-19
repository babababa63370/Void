import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";
import { eq, ilike, sql } from "drizzle-orm";
import { jwtVerify } from "jose";

const router: IRouter = Router();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

// GET /api/players — public, returns all players with at least one role
router.get("/players", async (_req, res) => {
  const players = await db
    .select({
      discordId: playerLoginsTable.discordId,
      username: playerLoginsTable.username,
      avatar: playerLoginsTable.avatar,
      discriminator: playerLoginsTable.discriminator,
      roles: playerLoginsTable.roles,
      cardBackground: playerLoginsTable.cardBackground,
    })
    .from(playerLoginsTable)
    .where(sql`cardinality(${playerLoginsTable.roles}) > 0`);

  res.json({ players });
});

// GET /api/players/profile/:username — public, full profile data
router.get("/players/profile/:username", async (req, res) => {
  const username = decodeURIComponent(req.params.username);

  const rows = await db
    .select()
    .from(playerLoginsTable)
    .where(ilike(playerLoginsTable.username, username));

  const player = rows.find((p) => p.username.toLowerCase() === username.toLowerCase());

  if (!player || !player.roles || player.roles.length === 0) {
    res.status(404).json({ error: "player_not_found" });
    return;
  }

  res.json({ player });
});

// PATCH /api/players/me — update own profile (JWT required)
router.patch("/players/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "no_token" });
    return;
  }

  let discordId: string;
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtSecret());
    if (!payload.sub) throw new Error("no_sub");
    discordId = payload.sub;
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return;
  }

  const { customAvatar, banner, background, font, music, links, brawlTag, backgroundVideo, cardBackground } = req.body as {
    customAvatar?: string | null;
    banner?: string | null;
    background?: string | null;
    font?: string | null;
    music?: string | null;
    links?: string | null;
    brawlTag?: string | null;
    backgroundVideo?: string | null;
    cardBackground?: string | null;
  };

  await db
    .update(playerLoginsTable)
    .set({
      customAvatar: customAvatar ?? null,
      banner: banner ?? null,
      background: background ?? null,
      font: font ?? null,
      music: music ?? null,
      links: links ?? null,
      brawlTag: brawlTag ?? null,
      backgroundVideo: backgroundVideo ?? null,
      cardBackground: cardBackground ?? null,
    })
    .where(eq(playerLoginsTable.discordId, discordId));

  res.json({ ok: true });
});

export default router;
