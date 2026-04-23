import { Router, type IRouter } from "express";
import { db, recruitmentApplicationsTable, playerLoginsTable } from "@workspace/db";
import { jwtVerify } from "jose";
import { sql, desc, eq, and } from "drizzle-orm";
import { sendPanel, notifyStatusChange, DIVISIONS } from "../lib/recruitment.js";

const router: IRouter = Router();

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function requireStaff(
  req: import("express").Request,
  res: import("express").Response,
): Promise<{ discordId: string; username: string | null } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "no_token" });
    return null;
  }
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtSecret());
    const discordId = payload.sub as string;
    const rows = await db.select().from(playerLoginsTable).where(
      sql`${playerLoginsTable.discordId} = ${discordId}`,
    );
    const roles: string[] = rows[0]?.roles ?? [];
    if (!roles.includes("staff")) {
      res.status(403).json({ error: "forbidden" });
      return null;
    }
    return { discordId, username: rows[0]?.discordUsername ?? null };
  } catch {
    res.status(401).json({ error: "invalid_token" });
    return null;
  }
}

// POST /api/staff/recruitment/panel { channelId } → posts the panel
router.post("/staff/recruitment/panel", async (req, res) => {
  const me = await requireStaff(req, res);
  if (!me) return;

  const channelId = String(req.body?.channelId ?? "").trim();
  if (!/^\d{17,20}$/.test(channelId)) {
    return res.status(400).json({ error: "invalid_channel_id" });
  }
  try {
    const result = await sendPanel(channelId);
    return res.json({ ok: true, messageId: result.messageId });
  } catch (err) {
    console.error("[Recruitment] panel send failed:", err);
    return res.status(500).json({ error: err instanceof Error ? err.message : "panel_failed" });
  }
});

// GET /api/staff/recruitment/applications?status=&limit=&offset=
router.get("/staff/recruitment/applications", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const offset = Math.max(Number(req.query.offset ?? 0), 0);
  const status = typeof req.query.status === "string" && req.query.status !== "all" ? req.query.status : null;

  const where = status ? eq(recruitmentApplicationsTable.status, status) : undefined;

  const rows = await db
    .select()
    .from(recruitmentApplicationsTable)
    .where(where as any)
    .orderBy(desc(recruitmentApplicationsTable.createdAt))
    .limit(limit)
    .offset(offset);

  const totalRows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(recruitmentApplicationsTable)
    .where(where as any);

  return res.json({
    applications: rows,
    total: totalRows[0]?.c ?? 0,
    divisions: DIVISIONS,
  });
});

// GET /api/staff/recruitment/applications/:id
router.get("/staff/recruitment/applications/:id", async (req, res) => {
  if (!await requireStaff(req, res)) return;
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });
  const rows = await db.select().from(recruitmentApplicationsTable)
    .where(eq(recruitmentApplicationsTable.id, id));
  if (!rows[0]) return res.status(404).json({ error: "not_found" });
  return res.json({ application: rows[0], divisions: DIVISIONS });
});

// PATCH /api/staff/recruitment/applications/:id { status, staffNote }
router.patch("/staff/recruitment/applications/:id", async (req, res) => {
  const me = await requireStaff(req, res);
  if (!me) return;

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "bad_id" });

  const status = String(req.body?.status ?? "");
  if (!["accepted", "refused", "on_hold", "pending"].includes(status)) {
    return res.status(400).json({ error: "bad_status" });
  }
  const staffNote = typeof req.body?.staffNote === "string" ? req.body.staffNote : null;

  const rows = await db.select().from(recruitmentApplicationsTable)
    .where(eq(recruitmentApplicationsTable.id, id));
  const app = rows[0];
  if (!app) return res.status(404).json({ error: "not_found" });
  if (app.status === "draft") return res.status(400).json({ error: "draft_application" });

  const update: Record<string, unknown> = {
    status,
    staffNote,
    updatedAt: new Date(),
  };
  if (status !== "pending") {
    update.reviewedBy = me.discordId;
    update.reviewedByUsername = me.username;
    update.reviewedAt = new Date();
  } else {
    update.reviewedBy = null;
    update.reviewedByUsername = null;
    update.reviewedAt = null;
  }

  await db.update(recruitmentApplicationsTable)
    .set(update)
    .where(eq(recruitmentApplicationsTable.id, id));

  let dmDelivered = false;
  if (status === "accepted" || status === "refused" || status === "on_hold") {
    dmDelivered = await notifyStatusChange(app, status, staffNote);
  }

  const updated = await db.select().from(recruitmentApplicationsTable)
    .where(eq(recruitmentApplicationsTable.id, id));
  return res.json({ application: updated[0], dmDelivered });
});

export default router;
