import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/players/login", async (req, res) => {
  const { discordTag } = req.body as { discordTag?: string };

  if (!discordTag || typeof discordTag !== "string" || !discordTag.trim()) {
    res.status(400).json({ error: "discordTag is required" });
    return;
  }

  try {
    await db.insert(playerLoginsTable).values({ discordTag: discordTag.trim() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "db_error" });
  }
});

export default router;
