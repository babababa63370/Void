import { Router } from "express";
import { db, matcherinoEventsTable } from "@workspace/db";

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
  totalBalance: number;
  participantsCount: number;
  game: { id: number; title: string; image: string; slug: string };
  meta: { backgroundImg?: string };
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
          endAt: s.endAt ? new Date(s.endAt) : null,
          totalBalance: s.totalBalance ?? 0,
          participantsCount: s.participantsCount ?? 0,
          heroImg: detail?.heroImg ?? s.heroImg ?? "",
          backgroundImg: detail?.meta?.backgroundImg ?? "",
          thumbnailImg: detail?.thumbnailImg ?? "",
          gameId: s.game?.id ?? null,
          gameTitle: s.game?.title ?? null,
          gameImage: s.game?.image ?? null,
          gameSlug: s.game?.slug ?? null,
          fetchedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: matcherinoEventsTable.id,
          set: {
            title: detail?.title ?? s.title ?? `Tournament ${s.id}`,
            startAt: s.startAt ? new Date(s.startAt) : null,
            endAt: s.endAt ? new Date(s.endAt) : null,
            totalBalance: s.totalBalance ?? 0,
            participantsCount: s.participantsCount ?? 0,
            heroImg: detail?.heroImg ?? s.heroImg ?? "",
            backgroundImg: detail?.meta?.backgroundImg ?? "",
            thumbnailImg: detail?.thumbnailImg ?? "",
            gameId: s.game?.id ?? null,
            gameTitle: s.game?.title ?? null,
            gameImage: s.game?.image ?? null,
            gameSlug: s.game?.slug ?? null,
            fetchedAt: new Date(),
          },
        });
    }),
  );
}

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

export default router;
