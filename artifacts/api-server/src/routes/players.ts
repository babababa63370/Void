import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";
import { isNotNull } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/players — public, returns all players with an assigned role
router.get("/players", async (_req, res) => {
  const players = await db
    .select({
      discordId: playerLoginsTable.discordId,
      username: playerLoginsTable.username,
      avatar: playerLoginsTable.avatar,
      discriminator: playerLoginsTable.discriminator,
      role: playerLoginsTable.role,
    })
    .from(playerLoginsTable)
    .where(isNotNull(playerLoginsTable.role));

  res.json({ players });
});

export default router;
