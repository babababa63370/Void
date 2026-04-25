import { db, tipsTable, settingsTable } from "@workspace/db";
import { eq, inArray, sql } from "drizzle-orm";

const API_BASE = (process.env.PAYPAL_MEONIX_URL ?? "https://paypal.meonix.me").replace(/\/+$/, "");

const LAST_SYNC_KEY = "tips.meonix_last_sync";
const LAST_ERROR_KEY = "tips.meonix_last_error";

export class MeonixApiConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MeonixApiConfigError";
  }
}

export class MeonixApiError extends Error {
  status: number;
  detail: string;
  constructor(message: string, status: number, detail: string) {
    super(message);
    this.name = "MeonixApiError";
    this.status = status;
    this.detail = detail;
  }
}

function getToken(): string {
  const t = process.env.PAYPAL_MEONIX_TOKEN;
  if (!t) throw new MeonixApiConfigError("PAYPAL_MEONIX_TOKEN not set");
  return t;
}

export function isMeonixApiConfigured(): boolean {
  return !!process.env.PAYPAL_MEONIX_TOKEN;
}

interface RemoteDonation {
  id: string;
  montant: number;
  date: string;
}

interface RemoteListResponse {
  periode: string;
  nombre: number;
  total: number;
  dons: RemoteDonation[];
}

async function callApi<T>(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      Accept: "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new MeonixApiError(`api_error_${res.status}`, res.status, text.slice(0, 500));
  }
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new MeonixApiError("invalid_json", res.status, text.slice(0, 500));
  }
}

// ── Public API wrappers ──────────────────────────────────────────────
export async function remoteAddDonation(amount: number): Promise<RemoteDonation> {
  const data = await callApi<{ message: string; don: RemoteDonation }>("POST", "/dons", {
    montant: amount,
  });
  return data.don;
}

export async function remoteListDonations(): Promise<RemoteDonation[]> {
  const data = await callApi<RemoteListResponse>("GET", "/dons?periode=tout");
  return data.dons ?? [];
}

export async function remoteDeleteDonation(id: string): Promise<void> {
  await callApi<{ message: string }>("DELETE", `/dons/${encodeURIComponent(id)}`);
}

// ── Local mirror ─────────────────────────────────────────────────────
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

async function clearSetting(key: string): Promise<void> {
  await db.delete(settingsTable).where(eq(settingsTable.key, key));
}

export interface SyncResult {
  inserted: number;
  removed: number;
  total: number;
  source: "meonix";
}

/**
 * Mirror remote donations into the local tips table.
 * - Inserts new donations (by external_id)
 * - Removes local rows whose external_id no longer exists remotely (deleted on the source)
 * - Preserves donor_name / message that were entered locally
 */
export async function syncMeonixDonations(): Promise<SyncResult> {
  if (!isMeonixApiConfigured()) {
    throw new MeonixApiConfigError("Meonix API not configured");
  }

  let remote: RemoteDonation[];
  try {
    remote = await remoteListDonations();
  } catch (err) {
    const detail = err instanceof MeonixApiError ? err.detail : String(err);
    await writeSetting(LAST_ERROR_KEY, `fetch: ${detail.slice(0, 500)}`);
    throw err;
  }

  const remoteIds = new Set(remote.map((d) => d.id));

  // Existing local rows from this source
  const existing = await db
    .select({ id: tipsTable.id, externalId: tipsTable.externalId })
    .from(tipsTable)
    .where(eq(tipsTable.source, "meonix"));
  const existingMap = new Map(
    existing
      .filter((r): r is { id: number; externalId: string } => !!r.externalId)
      .map((r) => [r.externalId, r.id]),
  );

  // Insert new ones
  const toInsert: Array<typeof tipsTable.$inferInsert> = [];
  for (const d of remote) {
    if (existingMap.has(d.id)) continue;
    if (typeof d.montant !== "number" || d.montant <= 0) continue;
    toInsert.push({
      amountCents: Math.round(d.montant * 100),
      currency: "EUR",
      source: "meonix",
      externalId: d.id,
      receivedAt: d.date ? new Date(d.date) : new Date(),
    });
  }
  if (toInsert.length > 0) {
    await db.insert(tipsTable).values(toInsert);
  }

  // Remove local rows that disappeared remotely
  const removedIds = [...existingMap.entries()]
    .filter(([extId]) => !remoteIds.has(extId))
    .map(([, localId]) => localId);
  if (removedIds.length > 0) {
    await db.delete(tipsTable).where(inArray(tipsTable.id, removedIds));
  }

  await writeSetting(LAST_SYNC_KEY, new Date().toISOString());
  await clearSetting(LAST_ERROR_KEY);

  return {
    inserted: toInsert.length,
    removed: removedIds.length,
    total: remote.length,
    source: "meonix",
  };
}

export async function getMeonixStatus(): Promise<{
  configured: boolean;
  url: string;
  lastSync: string | null;
  lastError: string | null;
}> {
  return {
    configured: isMeonixApiConfigured(),
    url: API_BASE,
    lastSync: await readSetting(LAST_SYNC_KEY),
    lastError: await readSetting(LAST_ERROR_KEY),
  };
}

// ── Background auto-sync ─────────────────────────────────────────────
let backgroundRunning = false;
let lastBackgroundSync = 0;
const BACKGROUND_INTERVAL_MS = 5 * 60 * 1000;

export function maybeBackgroundSyncMeonix(): void {
  if (!isMeonixApiConfigured()) return;
  if (backgroundRunning) return;
  if (Date.now() - lastBackgroundSync < BACKGROUND_INTERVAL_MS) return;

  backgroundRunning = true;
  lastBackgroundSync = Date.now();
  void syncMeonixDonations()
    .catch(() => {
      // errors persisted by syncMeonixDonations
    })
    .finally(() => {
      backgroundRunning = false;
    });
}
