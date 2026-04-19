import { Router, type IRouter } from "express";
import { db, playerLoginsTable, PLAYER_ROLES } from "@workspace/db";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";

const router: IRouter = Router();

const ADMIN_DISCORD_ID = "1243206708604702791";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function requireAdmin(req: import("express").Request, res: import("express").Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "no_token" });
    return null;
  }
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtSecret());
    if (payload.sub !== ADMIN_DISCORD_ID) {
      res.status(403).json({ error: "forbidden" });
      return null;
    }
    return payload.sub;
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return null;
  }
}

// GET /api/admin/players — list all players
router.get("/admin/players", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const players = await db
    .select({
      discordId: playerLoginsTable.discordId,
      username: playerLoginsTable.username,
      avatar: playerLoginsTable.avatar,
      discriminator: playerLoginsTable.discriminator,
      roles: playerLoginsTable.roles,
      lastLoginAt: playerLoginsTable.lastLoginAt,
    })
    .from(playerLoginsTable)
    .orderBy(playerLoginsTable.lastLoginAt);

  res.json({ players });
});

// PATCH /api/admin/players/:discordId/role — assign roles to a player
router.patch("/admin/players/:discordId/role", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const { discordId } = req.params;
  const { roles } = req.body as { roles?: string[] };

  if (!Array.isArray(roles)) {
    res.status(400).json({ error: "roles_must_be_array" });
    return;
  }

  for (const r of roles) {
    if (!PLAYER_ROLES.includes(r as typeof PLAYER_ROLES[number])) {
      res.status(400).json({ error: "invalid_role", invalid: r, validRoles: PLAYER_ROLES });
      return;
    }
  }

  const existing = await db
    .select()
    .from(playerLoginsTable)
    .where(eq(playerLoginsTable.discordId, discordId));

  if (existing.length === 0) {
    res.status(404).json({ error: "player_not_found" });
    return;
  }

  // Deduplicate
  const uniqueRoles = [...new Set(roles)];

  await db
    .update(playerLoginsTable)
    .set({ roles: uniqueRoles })
    .where(eq(playerLoginsTable.discordId, discordId));

  res.json({ discordId, roles: uniqueRoles });
});

export default router;
