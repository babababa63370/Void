import { Router, type IRouter } from "express";
import { db, tipsTable, settingsTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import { jwtVerify } from "jose";
import {
  syncPayPalTips,
  getSyncStatus,
  isPayPalConfigured,
  maybeBackgroundSync,
  setPayPalEnv,
  PayPalConfigError,
  PayPalApiError,
} from "../lib/paypal";

const router: IRouter = Router();

const ADMIN_DISCORD_ID = "1243206708604702791";

const SETTINGS_KEYS = {
  enabled: "tips.enabled",
  paypalUrl: "tips.paypal_url",
  goalAmount: "tips.goal_amount",
  goalLabel: "tips.goal_label",
  showDonors: "tips.show_donors",
} as const;

const DEFAULTS = {
  enabled: false,
  paypalUrl: "https://www.paypal.com/paypalme/meonixvoid",
  goalAmount: 0,
  goalLabel: "",
  showDonors: true,
};

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function requireMeonix(
  req: import("express").Request,
  res: import("express").Response,
): Promise<string | null> {
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

async function readSettings() {
  const rows = await db.select().from(settingsTable);
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return {
    enabled: map.get(SETTINGS_KEYS.enabled) === "1",
    paypalUrl: map.get(SETTINGS_KEYS.paypalUrl) ?? DEFAULTS.paypalUrl,
    goalAmountCents: Number(map.get(SETTINGS_KEYS.goalAmount) ?? DEFAULTS.goalAmount),
    goalLabel: map.get(SETTINGS_KEYS.goalLabel) ?? DEFAULTS.goalLabel,
    showDonors: (map.get(SETTINGS_KEYS.showDonors) ?? "1") === "1",
  };
}

async function writeSetting(key: string, value: string) {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value, updatedAt: new Date() },
    });
}

async function getTotals() {
  const result = await db
    .select({
      total: sql<number>`COALESCE(SUM(${tipsTable.amountCents}), 0)`.mapWith(Number),
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(tipsTable);
  return result[0] ?? { total: 0, count: 0 };
}

// ── Public ──────────────────────────────────────────────────────────────
router.get("/tips/public", async (_req, res) => {
  try {
    const settings = await readSettings();

    if (!settings.enabled) {
      res.status(404).json({ error: "disabled" });
      return;
    }

    // Trigger a background PayPal sync (throttled to once every 5 min).
    maybeBackgroundSync();

    const totals = await getTotals();
    const recentTips = settings.showDonors
      ? await db
          .select({
            id: tipsTable.id,
            amountCents: tipsTable.amountCents,
            currency: tipsTable.currency,
            donorName: tipsTable.donorName,
            message: tipsTable.message,
            receivedAt: tipsTable.receivedAt,
          })
          .from(tipsTable)
          .orderBy(desc(tipsTable.receivedAt))
          .limit(20)
      : [];

    res.json({
      enabled: true,
      paypalUrl: settings.paypalUrl,
      goalAmountCents: settings.goalAmountCents,
      goalLabel: settings.goalLabel,
      showDonors: settings.showDonors,
      totalCents: totals.total,
      count: totals.count,
      recent: recentTips,
    });
  } catch (err) {
    res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

// Lightweight enabled check (used by navbar to know whether to show the link)
router.get("/tips/enabled", async (_req, res) => {
  try {
    const settings = await readSettings();
    res.json({ enabled: settings.enabled });
  } catch {
    res.json({ enabled: false });
  }
});

// ── Meonix-only ─────────────────────────────────────────────────────────
router.get("/tips", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;
  const rows = await db
    .select()
    .from(tipsTable)
    .orderBy(desc(tipsTable.receivedAt));
  res.json({ tips: rows });
});

router.get("/tips/settings", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;
  const [settings, paypal] = await Promise.all([readSettings(), getSyncStatus()]);
  res.json({ ...settings, paypal });
});

router.post("/tips/paypal-env", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;
  const body = req.body as { env?: string };
  if (body.env !== "live" && body.env !== "sandbox") {
    res.status(400).json({ error: "invalid_env" });
    return;
  }
  await setPayPalEnv(body.env);
  const status = await getSyncStatus();
  res.json({ ok: true, paypal: status });
});

router.post("/tips/sync", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;
  if (!isPayPalConfigured()) {
    res.status(400).json({ error: "paypal_not_configured" });
    return;
  }
  try {
    const result = await syncPayPalTips();
    const status = await getSyncStatus();
    res.json({ ok: true, result, paypal: status });
  } catch (err) {
    if (err instanceof PayPalConfigError) {
      res.status(400).json({ error: "paypal_not_configured", detail: err.message });
      return;
    }
    if (err instanceof PayPalApiError) {
      res.status(502).json({
        error: "paypal_api_error",
        status: err.status,
        detail: err.detail.slice(0, 500),
      });
      return;
    }
    res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

router.post("/tips/settings", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;

  const body = req.body as {
    enabled?: boolean;
    paypalUrl?: string;
    goalAmountCents?: number;
    goalLabel?: string;
    showDonors?: boolean;
  };

  try {
    if (body.enabled !== undefined) {
      await writeSetting(SETTINGS_KEYS.enabled, body.enabled ? "1" : "0");
    }
    if (typeof body.paypalUrl === "string") {
      await writeSetting(SETTINGS_KEYS.paypalUrl, body.paypalUrl.trim());
    }
    if (body.goalAmountCents !== undefined) {
      const n = Math.max(0, Math.floor(Number(body.goalAmountCents) || 0));
      await writeSetting(SETTINGS_KEYS.goalAmount, String(n));
    }
    if (typeof body.goalLabel === "string") {
      await writeSetting(SETTINGS_KEYS.goalLabel, body.goalLabel.trim());
    }
    if (body.showDonors !== undefined) {
      await writeSetting(SETTINGS_KEYS.showDonors, body.showDonors ? "1" : "0");
    }

    const settings = await readSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

router.post("/tips", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;

  const body = req.body as {
    amountCents?: number;
    amount?: number;
    currency?: string;
    donorName?: string | null;
    message?: string | null;
    receivedAt?: string | null;
  };

  let amountCents: number;
  if (typeof body.amountCents === "number") {
    amountCents = Math.floor(body.amountCents);
  } else if (typeof body.amount === "number") {
    amountCents = Math.round(body.amount * 100);
  } else {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    res.status(400).json({ error: "invalid_amount" });
    return;
  }

  try {
    const inserted = await db
      .insert(tipsTable)
      .values({
        amountCents,
        currency: (body.currency ?? "EUR").trim().toUpperCase().slice(0, 8) || "EUR",
        donorName: body.donorName?.trim() || null,
        message: body.message?.trim() || null,
        source: "manual",
        receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
      })
      .returning();
    res.json({ tip: inserted[0] });
  } catch (err) {
    res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

router.patch("/tips/:id", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }

  const body = req.body as {
    amountCents?: number;
    amount?: number;
    currency?: string;
    donorName?: string | null;
    message?: string | null;
    receivedAt?: string | null;
  };

  const patch: Partial<typeof tipsTable.$inferInsert> = {};
  if (typeof body.amountCents === "number") patch.amountCents = Math.floor(body.amountCents);
  else if (typeof body.amount === "number") patch.amountCents = Math.round(body.amount * 100);
  if (typeof body.currency === "string") patch.currency = body.currency.trim().toUpperCase().slice(0, 8) || "EUR";
  if (body.donorName !== undefined) patch.donorName = body.donorName?.trim() || null;
  if (body.message !== undefined) patch.message = body.message?.trim() || null;
  if (body.receivedAt) patch.receivedAt = new Date(body.receivedAt);

  if (Object.keys(patch).length === 0) {
    res.status(400).json({ error: "no_changes" });
    return;
  }

  try {
    const updated = await db
      .update(tipsTable)
      .set(patch)
      .where(eq(tipsTable.id, id))
      .returning();
    if (updated.length === 0) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ tip: updated[0] });
  } catch (err) {
    res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

router.delete("/tips/:id", async (req, res) => {
  if (!(await requireMeonix(req, res))) return;

  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid_id" });
    return;
  }

  try {
    const deleted = await db
      .delete(tipsTable)
      .where(eq(tipsTable.id, id))
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "server_error", detail: String(err) });
  }
});

export default router;
