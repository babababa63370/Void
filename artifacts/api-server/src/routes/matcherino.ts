import { Router } from "express";

const router = Router();

const MATCHERINO_USER_ID = 2423612;
const MATCHERINO_API = "https://api.matcherino.com/__api/bounties/search";
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
  description: string;
  game: { id: number; title: string; image: string; slug: string };
  meta: { backgroundImg?: string };
}

async function fetchFullDetail(id: number): Promise<BountyDetail | null> {
  try {
    const res = await fetch(`${MATCHERINO_DETAIL}?id=${id}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as BountyDetail;
    return data;
  } catch {
    return null;
  }
}

router.get("/matcherino/events", async (_req, res) => {
  try {
    const summaries: Array<{ id: number; creator: { id: number }; [key: string]: unknown }> = [];
    let url: string | null = `${MATCHERINO_API}?pageSize=${PAGE_SIZE}`;

    for (let page = 0; page < MAX_PAGES && url !== null; page++) {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as {
        status: number;
        body: {
          contents: Array<{ id: number; creator: { id: number }; [key: string]: unknown }>;
          moreAfter: boolean;
          links: { next?: string };
        };
      };

      if (data.status !== 200) break;

      const filtered = data.body.contents.filter(
        (item) => item.creator.id === MATCHERINO_USER_ID,
      );
      summaries.push(...filtered);

      url = data.body.moreAfter && data.body.links.next
        ? data.body.links.next
        : null;
    }

    const events = await Promise.all(
      summaries.map(async (s) => {
        const detail = await fetchFullDetail(s.id);
        if (!detail) return s;
        return {
          ...s,
          heroImg: detail.heroImg || s.heroImg,
          thumbnailImg: detail.thumbnailImg,
          description: detail.description,
          backgroundImg: detail.meta?.backgroundImg ?? "",
        };
      }),
    );

    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Matcherino events" });
  }
});

export default router;
