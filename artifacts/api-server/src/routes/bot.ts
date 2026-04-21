import { Router, type IRouter } from "express";
import { db, playerLoginsTable } from "@workspace/db";
import { jwtVerify } from "jose";
import { sql } from "drizzle-orm";
import { getBotInfo, setBotPresence, SLASH_COMMANDS, type BotPresence, type BotStatus, type ActivityKind } from "../lib/bot.js";

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

// GET /api/bot/status
router.get("/bot/status", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  res.json(getBotInfo());
});

// GET /api/bot/commands
router.get("/bot/commands", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  res.json({ commands: SLASH_COMMANDS });
});

// PATCH /api/bot/presence
router.patch("/bot/presence", async (req, res) => {
  if (!await requireStaff(req, res)) return;

  const VALID_STATUSES: BotStatus[] = ["online", "idle", "dnd", "invisible"];
  const VALID_KINDS: ActivityKind[] = ["none", "playing", "listening", "watching", "streaming", "competing"];

  const { status, activityKind, activityName, streamUrl } = req.body as Partial<BotPresence>;

  if (status && !VALID_STATUSES.includes(status)) {
    res.status(400).json({ error: "invalid_status" });
    return;
  }
  if (activityKind && !VALID_KINDS.includes(activityKind)) {
    res.status(400).json({ error: "invalid_activity_kind" });
    return;
  }

  const current = getBotInfo().presence;
  const next: BotPresence = {
    status: status ?? current.status,
    activityKind: activityKind ?? current.activityKind,
    activityName: activityName ?? current.activityName,
    streamUrl: streamUrl ?? current.streamUrl,
  };

  try {
    await setBotPresence(next);
    res.json({ ok: true, presence: next });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown_error";
    res.status(503).json({ error: message });
  }
});

export default router;
