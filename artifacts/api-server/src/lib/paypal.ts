import { db, tipsTable, settingsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";

const PAYPAL_BASE = (process.env.PAYPAL_ENV ?? "live").toLowerCase() === "sandbox"
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

const LAST_SYNC_KEY = "tips.paypal_last_sync";
const LAST_ERROR_KEY = "tips.paypal_last_error";

let cachedToken: { token: string; expiresAt: number } | null = null;

export class PayPalConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayPalConfigError";
  }
}

export class PayPalApiError extends Error {
  status: number;
  detail: string;
  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = "PayPalApiError";
    this.status = status;
    this.detail = detail;
  }
}

function requireCreds(): { id: string; secret: string } {
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) {
    throw new PayPalConfigError("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set");
  }
  return { id, secret };
}

export function isPayPalConfigured(): boolean {
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const { id, secret } = requireCreds();
  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
  });

  const text = await res.text();
  if (!res.ok) {
    throw new PayPalApiError("oauth_failed", res.status, text);
  }

  const data = JSON.parse(text) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };
  return data.access_token;
}

interface PayPalTransaction {
  transaction_info: {
    transaction_id: string;
    transaction_event_code?: string;
    transaction_initiation_date?: string;
    transaction_updated_date?: string;
    transaction_status?: string;
    transaction_amount?: { value: string; currency_code: string };
    fee_amount?: { value: string; currency_code: string };
    transaction_note?: string;
    transaction_subject?: string;
  };
  payer_info?: {
    account_id?: string;
    email_address?: string;
    payer_name?: {
      given_name?: string;
      surname?: string;
      alternate_full_name?: string;
    };
  };
}

interface TransactionsResponse {
  transaction_details?: PayPalTransaction[];
  page?: number;
  total_items?: number;
  total_pages?: number;
}

function isoNoMs(d: Date): string {
  // PayPal expects ISO 8601 without milliseconds, e.g. 2024-01-01T00:00:00-0700 or with Z
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

async function fetchTransactionsPage(
  token: string,
  startDate: Date,
  endDate: Date,
  page: number,
): Promise<TransactionsResponse> {
  const url = new URL(`${PAYPAL_BASE}/v1/reporting/transactions`);
  url.searchParams.set("start_date", isoNoMs(startDate));
  url.searchParams.set("end_date", isoNoMs(endDate));
  url.searchParams.set("fields", "transaction_info,payer_info");
  url.searchParams.set("page_size", "100");
  url.searchParams.set("page", String(page));
  // Only completed transactions (S = Success)
  url.searchParams.set("transaction_status", "S");

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const text = await res.text();
  if (!res.ok) {
    throw new PayPalApiError("transactions_failed", res.status, text);
  }
  return JSON.parse(text) as TransactionsResponse;
}

function pickDonorName(p: PayPalTransaction["payer_info"]): string | null {
  if (!p) return null;
  const pn = p.payer_name;
  if (!pn) return null;
  if (pn.alternate_full_name) return pn.alternate_full_name;
  const joined = [pn.given_name, pn.surname].filter(Boolean).join(" ").trim();
  return joined || null;
}

function pickMessage(t: PayPalTransaction["transaction_info"]): string | null {
  return t.transaction_note?.trim() || t.transaction_subject?.trim() || null;
}

export interface SyncResult {
  inserted: number;
  scanned: number;
  windowStart: string;
  windowEnd: string;
  pages: number;
}

async function readSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  return rows[0]?.value ?? null;
}

async function writeSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({
      target: settingsTable.key,
      set: { value, updatedAt: new Date() },
    });
}

/**
 * Sync PayPal transactions into the `tips` table.
 * Only inserts transactions that aren't already present (dedupe on external_id).
 * Window: from last_sync (or 30 days ago by default), capped at 31 days per call.
 */
export async function syncPayPalTips(opts?: { fullScanDays?: number }): Promise<SyncResult> {
  if (!isPayPalConfigured()) {
    throw new PayPalConfigError("PayPal not configured");
  }

  const now = new Date();
  const lookbackDays = opts?.fullScanDays ?? 31;

  const lastSyncStr = await readSetting(LAST_SYNC_KEY);
  let windowStart: Date;
  if (lastSyncStr) {
    // Re-scan a small overlap (24h) to catch in-flight transactions.
    windowStart = new Date(new Date(lastSyncStr).getTime() - 24 * 60 * 60 * 1000);
  } else {
    windowStart = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  }

  // Cap window to 31 days (PayPal API hard limit per call)
  const maxSpanMs = 31 * 24 * 60 * 60 * 1000;
  if (now.getTime() - windowStart.getTime() > maxSpanMs) {
    windowStart = new Date(now.getTime() - maxSpanMs + 60_000);
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (err) {
    const detail = err instanceof PayPalApiError ? err.detail : String(err);
    await writeSetting(LAST_ERROR_KEY, `auth: ${detail.slice(0, 500)}`);
    throw err;
  }

  let scanned = 0;
  let inserted = 0;
  let pages = 0;
  let pageNum = 1;
  let totalPages = 1;
  const collected: PayPalTransaction[] = [];

  try {
    while (pageNum <= totalPages && pageNum <= 20) {
      const data = await fetchTransactionsPage(token, windowStart, now, pageNum);
      const txs = data.transaction_details ?? [];
      collected.push(...txs);
      scanned += txs.length;
      totalPages = data.total_pages ?? 1;
      pages = pageNum;
      pageNum++;
    }
  } catch (err) {
    const detail = err instanceof PayPalApiError ? err.detail : String(err);
    await writeSetting(LAST_ERROR_KEY, `fetch: ${detail.slice(0, 500)}`);
    throw err;
  }

  if (collected.length > 0) {
    const ids = collected
      .map((t) => t.transaction_info?.transaction_id)
      .filter((x): x is string => !!x);

    const existing = ids.length
      ? await db
          .select({ externalId: tipsTable.externalId })
          .from(tipsTable)
          .where(inArray(tipsTable.externalId, ids))
      : [];
    const existingSet = new Set(existing.map((r) => r.externalId));

    const toInsert: Array<typeof tipsTable.$inferInsert> = [];
    for (const tx of collected) {
      const info = tx.transaction_info;
      if (!info?.transaction_id) continue;
      if (existingSet.has(info.transaction_id)) continue;

      const amountStr = info.transaction_amount?.value;
      if (!amountStr) continue;
      const amountNum = Number(amountStr);
      if (!Number.isFinite(amountNum)) continue;
      // Only count incoming positive amounts (donations).
      if (amountNum <= 0) continue;

      const currency = info.transaction_amount?.currency_code ?? "EUR";
      const receivedAt = info.transaction_initiation_date
        ? new Date(info.transaction_initiation_date)
        : new Date();

      toInsert.push({
        amountCents: Math.round(amountNum * 100),
        currency,
        donorName: pickDonorName(tx.payer_info),
        message: pickMessage(info),
        source: "paypal",
        externalId: info.transaction_id,
        receivedAt,
      });
    }

    if (toInsert.length > 0) {
      await db.insert(tipsTable).values(toInsert);
      inserted = toInsert.length;
    }
  }

  await writeSetting(LAST_SYNC_KEY, now.toISOString());
  // Clear last error on success
  await db.delete(settingsTable).where(eq(settingsTable.key, LAST_ERROR_KEY));

  return {
    inserted,
    scanned,
    windowStart: windowStart.toISOString(),
    windowEnd: now.toISOString(),
    pages,
  };
}

export async function getSyncStatus(): Promise<{
  configured: boolean;
  environment: "live" | "sandbox";
  lastSync: string | null;
  lastError: string | null;
}> {
  const env = (process.env.PAYPAL_ENV ?? "live").toLowerCase() === "sandbox" ? "sandbox" : "live";
  return {
    configured: isPayPalConfigured(),
    environment: env,
    lastSync: await readSetting(LAST_SYNC_KEY),
    lastError: await readSetting(LAST_ERROR_KEY),
  };
}

// Background auto-sync: triggered by API hits, throttled.
let backgroundRunning = false;
let lastBackgroundSync = 0;
const BACKGROUND_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function maybeBackgroundSync(): void {
  if (!isPayPalConfigured()) return;
  if (backgroundRunning) return;
  if (Date.now() - lastBackgroundSync < BACKGROUND_INTERVAL_MS) return;

  backgroundRunning = true;
  lastBackgroundSync = Date.now();
  void syncPayPalTips()
    .catch(() => {
      // Errors are persisted via writeSetting in syncPayPalTips
    })
    .finally(() => {
      backgroundRunning = false;
    });
}
