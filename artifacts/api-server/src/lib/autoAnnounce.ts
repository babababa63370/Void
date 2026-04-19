import { db, matcherinoEventsTable, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sendMatcherinoAnnouncement } from "./bot";

const PING_ID = "1495421946832359504";
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const MATCHERINO_SEARCH = "https://api.matcherino.com/__api/bounties/search";
const MATCHERINO_USER_ID = 2423612;

export interface AutoAnnounceState {
  enabled: boolean;
  channelId: string;
  lastCheckedAt: string | null;
  nextCheckAt: string | null;
  lastAnnouncedTitle: string | null;
  lastAnnouncedAt: string | null;
}

let state: AutoAnnounceState = {
  enabled: false,
  channelId: "",
  lastCheckedAt: null,
  nextCheckAt: null,
  lastAnnouncedTitle: null,
  lastAnnouncedAt: null,
};

let intervalId: ReturnType<typeof setInterval> | null = null;

export function getAutoAnnounceState(): AutoAnnounceState {
  return { ...state };
}

async function syncAndAnnounce(): Promise<void> {
  state.lastCheckedAt = new Date().toISOString();
  state.nextCheckAt = new Date(Date.now() + CHECK_INTERVAL_MS).toISOString();

  try {
    const res = await fetch(`${MATCHERINO_SEARCH}?pageSize=50`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return;

    const data = (await res.json()) as {
      status: number;
      body: { contents: Array<{ id: number; creator: { id: number }; startAt: string; endAt: string | null; totalBalance: number; participantsCount: number; heroImg: string; game: { id: number; title: string; image: string; slug: string } }> };
    };
    if (data.status !== 200) return;

    const ours = data.body.contents.filter((item) => item.creator.id === MATCHERINO_USER_ID);

    for (const s of ours) {
      const [existing] = await db
        .select()
        .from(matcherinoEventsTable)
        .where(eq(matcherinoEventsTable.id, s.id));

      if (!existing) {
        await db.insert(matcherinoEventsTable).values({
          id: s.id,
          title: `Tournament ${s.id}`,
          kind: "tournament",
          startAt: s.startAt ? new Date(s.startAt) : null,
          endAt: s.endAt ? new Date(s.endAt) : null,
          totalBalance: s.totalBalance ?? 0,
          participantsCount: s.participantsCount ?? 0,
          heroImg: s.heroImg ?? "",
          backgroundImg: "",
          thumbnailImg: "",
          gameId: s.game?.id ?? null,
          gameTitle: s.game?.title ?? null,
          gameImage: s.game?.image ?? null,
          gameSlug: s.game?.slug ?? null,
          fetchedAt: new Date(),
          announced: false,
        });
      }

      const row = existing ?? (await db.select().from(matcherinoEventsTable).where(eq(matcherinoEventsTable.id, s.id)))[0];
      if (!row || row.announced) continue;

      await sendMatcherinoAnnouncement(state.channelId, {
        id: row.id,
        title: row.title,
        gameTitle: row.gameTitle,
        heroImg: row.heroImg || row.backgroundImg || "",
        startAt: row.startAt?.toISOString() ?? null,
        endAt: row.endAt?.toISOString() ?? null,
        participantsCount: row.participantsCount,
        totalBalance: row.totalBalance,
        isTest: false,
        pingId: PING_ID,
      });

      await db
        .update(matcherinoEventsTable)
        .set({ announced: true, announcedAt: new Date() })
        .where(eq(matcherinoEventsTable.id, row.id));

      state.lastAnnouncedTitle = row.title;
      state.lastAnnouncedAt = new Date().toISOString();
    }
  } catch (err) {
    console.error("[AutoAnnounce] Error during sync:", err);
  }
}

export async function persistSettings(channelId: string, enabled: boolean): Promise<void> {
  for (const [key, value] of Object.entries({ "matcherino.channelId": channelId, "matcherino.autoAnnounce": enabled ? "true" : "false" })) {
    await db.insert(settingsTable).values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
  }
}

export async function loadSettings(): Promise<{ channelId: string; autoEnabled: boolean }> {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  return {
    channelId: map["matcherino.channelId"] ?? "",
    autoEnabled: map["matcherino.autoAnnounce"] === "true",
  };
}

export async function initAutoAnnounce(): Promise<void> {
  try {
    const saved = await loadSettings();
    if (saved.autoEnabled && saved.channelId) {
      console.log(`[AutoAnnounce] Reprise depuis DB — canal ${saved.channelId}`);
      startAutoAnnounce(saved.channelId);
    }
  } catch (err) {
    console.error("[AutoAnnounce] Erreur init:", err);
  }
}

export function startAutoAnnounce(channelId: string): void {
  stopAutoAnnounce();
  state = {
    enabled: true,
    channelId,
    lastCheckedAt: null,
    nextCheckAt: new Date(Date.now() + 1000).toISOString(),
    lastAnnouncedTitle: state.lastAnnouncedTitle,
    lastAnnouncedAt: state.lastAnnouncedAt,
  };
  syncAndAnnounce();
  intervalId = setInterval(syncAndAnnounce, CHECK_INTERVAL_MS);
}

export function stopAutoAnnounce(): void {
  if (intervalId) { clearInterval(intervalId); intervalId = null; }
  state = { ...state, enabled: false, nextCheckAt: null };
}
