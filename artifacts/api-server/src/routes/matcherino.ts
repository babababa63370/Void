import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, matcherinoEventsTable } from "@workspace/db";
import { jwtVerify } from "jose";
import { sql } from "drizzle-orm";
import { db as dbPlayers, playerLoginsTable } from "@workspace/db";
import { sendMatcherinoAnnouncement } from "../lib/bot";
import { generateMatcherinoCard } from "../lib/matcherinoCard";
import { startAutoAnnounce, stopAutoAnnounce, getAutoAnnounceState, persistSettings, loadSettings } from "../lib/autoAnnounce";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function requireStaff(req: import("express").Request, res: import("express").Response): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "no_token" }); return null; }
  try {
    const { payload } = await jwtVerify(authHeader.slice(7), getJwtSecret());
    const discordId = payload.sub as string;
    const rows = await dbPlayers.select().from(playerLoginsTable).where(sql`${playerLoginsTable.discordId} = ${discordId}`);
    const roles: string[] = rows[0]?.roles ?? [];
    if (!roles.includes("staff")) { res.status(403).json({ error: "forbidden" }); return null; }
    return discordId;
  } catch { res.status(401).json({ error: "invalid_token" }); return null; }
}

const router = Router();

const MATCHERINO_USER_ID = 2423612;
const MATCHERINO_SEARCH = "https://api.matcherino.com/__api/bounties/search";
const MATCHERINO_DETAIL = "https://api.matcherino.com/__api/bounties";
const MAX_PAGES = 5;
const PAGE_SIZE = 50;

interface BountyDetail {
  id: number;
  title: string;
  kind: string;
  heroImg: string;
  thumbnailImg: string;
  startAt: string;
  endAt: string | null;
  finalizedAt: string | null;
  totalBalance: number;
  participantsCount: number;
  playerLimit: number;
  entryFee: number;
  description: string;
  game: { id: number; title: string; image: string; slug: string };
  meta: {
    backgroundImg?: string;
    eventSocials?: {
      discord?: string;
      twitch?: string;
      twitter?: string;
      youtube?: string;
      instagram?: string;
      facebook?: string;
    };
    zone?: string;
  };
  roles: Array<{
    userId: number;
    userName: string;
    displayName: string;
    role: string;
    authProvider: string;
    supercellBgcolor?: string;
    supercellCharacter?: string;
  }>;
  payouts: Array<{ place: number; amount: string }> | null;
}

async function fetchFullDetail(id: number): Promise<BountyDetail | null> {
  try {
    const res = await fetch(`${MATCHERINO_DETAIL}?id=${id}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as BountyDetail;
  } catch {
    return null;
  }
}

async function fetchAndSyncEvents(): Promise<void> {
  const summaries: Array<{ id: number; creator: { id: number }; startAt: string; endAt: string | null; totalBalance: number; participantsCount: number; heroImg: string; game: { id: number; title: string; image: string; slug: string } }> = [];
  let url: string | null = `${MATCHERINO_SEARCH}?pageSize=${PAGE_SIZE}`;

  for (let page = 0; page < MAX_PAGES && url !== null; page++) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    const data = (await response.json()) as {
      status: number;
      body: {
        contents: typeof summaries;
        moreAfter: boolean;
        links: { next?: string };
      };
    };
    if (data.status !== 200) break;
    summaries.push(...data.body.contents.filter((item) => item.creator.id === MATCHERINO_USER_ID));
    url = data.body.moreAfter && data.body.links.next ? data.body.links.next : null;
  }

  await Promise.all(
    summaries.map(async (s) => {
      const detail = await fetchFullDetail(s.id);
      await db
        .insert(matcherinoEventsTable)
        .values({
          id: s.id,
          title: detail?.title ?? s.title ?? `Tournament ${s.id}`,
          kind: "tournament",
          startAt: s.startAt ? new Date(s.startAt) : null,
          endAt: detail?.endAt ? new Date(detail.endAt) : s.endAt ? new Date(s.endAt) : null,
          totalBalance: s.totalBalance ?? 0,
          participantsCount: s.participantsCount ?? 0,
          heroImg: detail?.heroImg ?? s.heroImg ?? "",
          backgroundImg: detail?.meta?.backgroundImg ?? "",
          thumbnailImg: detail?.thumbnailImg ?? "",
          gameId: s.game?.id ?? null,
          gameTitle: s.game?.title ?? null,
          gameImage: s.game?.image ?? null,
          gameSlug: s.game?.slug ?? null,
          finalizedAt: detail?.finalizedAt ? new Date(detail.finalizedAt) : null,
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: matcherinoEventsTable.id,
          set: {
            title: detail?.title ?? s.title ?? `Tournament ${s.id}`,
            startAt: s.startAt ? new Date(s.startAt) : null,
            endAt: detail?.endAt ? new Date(detail.endAt) : s.endAt ? new Date(s.endAt) : null,
            totalBalance: s.totalBalance ?? 0,
            participantsCount: s.participantsCount ?? 0,
            heroImg: detail?.heroImg ?? s.heroImg ?? "",
            backgroundImg: detail?.meta?.backgroundImg ?? "",
            thumbnailImg: detail?.thumbnailImg ?? "",
            gameId: s.game?.id ?? null,
            gameTitle: s.game?.title ?? null,
            gameImage: s.game?.image ?? null,
            gameSlug: s.game?.slug ?? null,
            finalizedAt: detail?.finalizedAt ? new Date(detail.finalizedAt) : null,
            fetchedAt: new Date(),
          },
        });
    }),
  );
}

router.get("/matcherino/events/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });

  try {
    const [dbEvent] = await db
      .select()
      .from(matcherinoEventsTable)
      .where(eq(matcherinoEventsTable.id, id));

    const live = await fetchFullDetail(id);
    if (!live && !dbEvent) return res.status(404).json({ error: "Event not found" });

    return res.json({
      id: live?.id ?? dbEvent?.id,
      title: live?.title ?? dbEvent?.title,
      kind: live?.kind ?? dbEvent?.kind,
      startAt: live?.startAt ?? dbEvent?.startAt,
      endAt: live?.endAt ?? dbEvent?.endAt,
      finalizedAt: live?.finalizedAt ?? null,
      totalBalance: live?.totalBalance ?? dbEvent?.totalBalance,
      participantsCount: live?.participantsCount ?? dbEvent?.participantsCount,
      playerLimit: live?.playerLimit ?? 0,
      entryFee: live?.entryFee ?? 0,
      description: live?.description ?? "",
      heroImg: live?.heroImg ?? dbEvent?.heroImg ?? "",
      backgroundImg: live?.meta?.backgroundImg ?? dbEvent?.backgroundImg ?? "",
      thumbnailImg: live?.thumbnailImg ?? dbEvent?.thumbnailImg ?? "",
      game: live?.game ?? {
        id: dbEvent?.gameId,
        title: dbEvent?.gameTitle,
        image: dbEvent?.gameImage,
        slug: dbEvent?.gameSlug,
      },
      socials: live?.meta?.eventSocials ?? {},
      zone: live?.meta?.zone ?? null,
      roles: live?.roles ?? [],
      payouts: live?.payouts ?? null,
    });
  } catch {
    return res.status(500).json({ error: "Failed to load event" });
  }
});

router.get("/matcherino/events", async (_req, res) => {
  try {
    const events = await db.select().from(matcherinoEventsTable).orderBy(matcherinoEventsTable.startAt);
    res.json({ events });
  } catch {
    res.status(500).json({ error: "Failed to load events from database" });
  }
});

router.post("/matcherino/events/refresh", async (_req, res) => {
  try {
    await fetchAndSyncEvents();
    const events = await db.select().from(matcherinoEventsTable).orderBy(matcherinoEventsTable.startAt);
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: "Failed to refresh events" });
  }
});

router.get("/staff/matcherino/preview/:id", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const [event] = await db.select().from(matcherinoEventsTable).where(eq(matcherinoEventsTable.id, id));
  if (!event) return res.status(404).json({ error: "Event not found" });
  try {
    const buf = await generateMatcherinoCard({
      id: event.id, title: event.title, gameTitle: event.gameTitle,
      heroImg: event.heroImg || event.backgroundImg || "",
      startAt: event.startAt?.toISOString() ?? null,
      endAt: event.endAt?.toISOString() ?? null,
      participantsCount: event.participantsCount,
      totalBalance: event.totalBalance,
      isTest: false,
    });
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-cache");
    res.send(buf);
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to generate preview" });
  }
});

router.get("/staff/matcherino/auto-announce/status", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;
  res.json(getAutoAnnounceState());
});

router.post("/staff/matcherino/auto-announce/start", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;
  const { channelId } = req.body as { channelId: string };
  if (!channelId) return res.status(400).json({ error: "channelId required" });
  startAutoAnnounce(channelId);
  await persistSettings(channelId, true);
  res.json({ success: true, state: getAutoAnnounceState() });
});

router.post("/staff/matcherino/auto-announce/stop", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;
  stopAutoAnnounce();
  const cur = getAutoAnnounceState();
  await persistSettings(cur.channelId, false);
  res.json({ success: true, state: getAutoAnnounceState() });
});

router.get("/staff/matcherino/settings", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;
  const { db: dbSett, settingsTable } = await import("@workspace/db");
  const rows = await dbSett.select().from(settingsTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.key] = r.value;
  res.json({
    channelId: map["matcherino.channelId"] ?? "",
    autoEnabled: map["matcherino.autoAnnounce"] === "true",
    manualChannelId: map["matcherino.manualChannelId"] ?? "",
  });
});

router.post("/staff/matcherino/settings", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;
  const { key, value } = req.body as { key: string; value: string };
  if (!key) return res.status(400).json({ error: "key required" });
  const { db: dbSett, settingsTable } = await import("@workspace/db");
  await dbSett.insert(settingsTable).values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
  res.json({ success: true });
});

router.post("/staff/matcherino/announce", async (req, res) => {
  const requesterId = await requireStaff(req, res);
  if (!requesterId) return;

  const { eventId, channelId, isTest } = req.body as { eventId: number; channelId: string; isTest?: boolean };
  if (!eventId || !channelId) return res.status(400).json({ error: "eventId and channelId are required" });

  const [event] = await db.select().from(matcherinoEventsTable).where(eq(matcherinoEventsTable.id, eventId));
  if (!event) return res.status(404).json({ error: "Event not found" });

  try {
    await sendMatcherinoAnnouncement(channelId, {
      id: event.id,
      title: event.title,
      gameTitle: event.gameTitle,
      heroImg: event.heroImg || event.backgroundImg || "",
      startAt: event.startAt?.toISOString() ?? null,
      endAt: event.endAt?.toISOString() ?? null,
      participantsCount: event.participantsCount,
      totalBalance: event.totalBalance,
      isTest: isTest ?? false,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? "Failed to send announcement" });
  }
});

export default router;
