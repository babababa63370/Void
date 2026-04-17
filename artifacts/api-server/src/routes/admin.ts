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
      role: playerLoginsTable.role,
      lastLoginAt: playerLoginsTable.lastLoginAt,
    })
    .from(playerLoginsTable)
    .orderBy(playerLoginsTable.lastLoginAt);

  res.json({ players });
});

// PATCH /api/admin/players/:discordId/role — assign role to a player
router.patch("/admin/players/:discordId/role", async (req, res) => {
  const adminId = await requireAdmin(req, res);
  if (!adminId) return;

  const { discordId } = req.params;
  const { role } = req.body as { role?: string | null };

  if (role !== null && role !== undefined && !PLAYER_ROLES.includes(role as typeof PLAYER_ROLES[number])) {
    res.status(400).json({ error: "invalid_role", validRoles: PLAYER_ROLES });
    return;
  }

  const existing = await db
    .select()
    .from(playerLoginsTable)
    .where(eq(playerLoginsTable.discordId, discordId));

  if (existing.length === 0) {
    res.status(404).json({ error: "player_not_found" });
    return;
  }

  await db
    .update(playerLoginsTable)
    .set({ role: role ?? null })
    .where(eq(playerLoginsTable.discordId, discordId));

  res.json({ discordId, role: role ?? null });
});

export default router;
