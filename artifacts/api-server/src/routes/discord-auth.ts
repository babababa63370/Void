import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";

const router: IRouter = Router();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

// POST /api/auth/discord/exchange — exchange code for user info + signed JWT
router.post("/auth/discord/exchange", async (req, res) => {
  const { code, redirectUri } = req.body as { code?: string; redirectUri?: string };

  if (!code || !redirectUri) {
    res.status(400).json({ error: "code and redirectUri are required" });
    return;
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    res.status(500).json({ error: "Discord OAuth not configured" });
    return;
  }

  try {
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Discord token exchange failed:", err);
      res.status(401).json({ error: "discord_token_failed" });
      return;
    }

    const tokenData = (await tokenRes.json()) as DiscordTokenResponse;

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      res.status(401).json({ error: "discord_user_failed" });
      return;
    }

    const user = (await userRes.json()) as DiscordUser;

    const displayName =
      user.global_name ?? (user.discriminator !== "0" ? `${user.username}#${user.discriminator}` : user.username);

    // Upsert in DB
    const existing = await db.select().from(playerLoginsTable).where(eq(playerLoginsTable.discordId, user.id));
    if (existing.length > 0) {
      await db
        .update(playerLoginsTable)
        .set({ username: displayName, discriminator: user.discriminator, avatar: user.avatar, lastLoginAt: new Date() })
        .where(eq(playerLoginsTable.discordId, user.id));
    } else {
      await db.insert(playerLoginsTable).values({
        discordId: user.id,
        username: displayName,
        discriminator: user.discriminator,
        avatar: user.avatar,
      });
    }

    // Sign a JWT — 30 days expiry
    const token = await new SignJWT({ username: displayName, avatar: user.avatar, discriminator: user.discriminator })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(getJwtSecret());

    res.json({
      discordId: user.id,
      username: displayName,
      avatar: user.avatar,
      discriminator: user.discriminator,
      token,
    });
  } catch (err) {
    console.error("Discord OAuth error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// GET /api/auth/discord/url
router.get("/auth/discord/url", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  if (!clientId) {
    res.status(500).json({ error: "Discord OAuth not configured" });
    return;
  }
  const { redirectUri } = req.query as { redirectUri?: string };
  if (!redirectUri) {
    res.status(400).json({ error: "redirectUri is required" });
    return;
  }
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "identify");
  res.json({ url: url.toString() });
});

// GET /api/auth/verify — validates the JWT, returns the Discord ID + roles
router.get("/auth/verify", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "no_token" });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const discordId = payload.sub as string;

    const rows = await db.select().from(playerLoginsTable).where(eq(playerLoginsTable.discordId, discordId));
    const roles: string[] = rows[0]?.roles ?? [];

    res.json({
      discordId,
      username: payload.username,
      avatar: payload.avatar,
      roles,
    });
  } catch {
    res.status(401).json({ error: "invalid_token" });
  }
});

export default router;
