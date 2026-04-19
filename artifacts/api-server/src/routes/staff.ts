import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";
import { jwtVerify } from "jose";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function requireStaff(req: import("express").Request, res: import("express").Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "no_token" });
    return null;
  }
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtSecret());
    const discordId = payload.sub as string;
    const rows = await db.select().from(playerLoginsTable).where(
      sql`${playerLoginsTable.discordId} = ${discordId}`
    );
    const roles: string[] = rows[0]?.roles ?? [];
    if (!roles.includes("staff")) {
      res.status(403).json({ error: "forbidden" });
      return null;
    }
    return discordId;
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return null;
  }
}

// GET /api/staff/members — list all members with at least one role (staff-only)
router.get("/staff/members", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;

  const members = await db
    .select({
      discordId: playerLoginsTable.discordId,
      username: playerLoginsTable.username,
      avatar: playerLoginsTable.avatar,
      discriminator: playerLoginsTable.discriminator,
      roles: playerLoginsTable.roles,
    })
    .from(playerLoginsTable)
    .where(sql`array_length(${playerLoginsTable.roles}, 1) > 0`);

  res.json(members);
});

export default router;
