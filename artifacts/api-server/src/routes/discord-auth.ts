import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

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
    // Exchange code for access token
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

    // Fetch Discord user info
    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      res.status(401).json({ error: "discord_user_failed" });
      return;
    }

    const user = (await userRes.json()) as DiscordUser;

    // Display name: use global_name (new Discord) or username#discriminator (legacy)
    const displayName =
      user.global_name ?? (user.discriminator !== "0" ? `${user.username}#${user.discriminator}` : user.username);

    // Upsert into DB
    const existing = await db.select().from(playerLoginsTable).where(eq(playerLoginsTable.discordId, user.id));

    if (existing.length > 0) {
      await db
        .update(playerLoginsTable)
        .set({
          username: displayName,
          discriminator: user.discriminator,
          avatar: user.avatar,
          lastLoginAt: new Date(),
        })
        .where(eq(playerLoginsTable.discordId, user.id));
    } else {
      await db.insert(playerLoginsTable).values({
        discordId: user.id,
        username: displayName,
        discriminator: user.discriminator,
        avatar: user.avatar,
      });
    }

    res.json({
      discordId: user.id,
      username: displayName,
      avatar: user.avatar,
      discriminator: user.discriminator,
    });
  } catch (err) {
    console.error("Discord OAuth error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

// Return the Discord OAuth URL (so frontend doesn't hardcode client_id)
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

export default router;
