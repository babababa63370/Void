import { Router } from "express";

const router = Router();

const MATCHERINO_USER_ID = 2423612;
const MATCHERINO_API = "https://api.matcherino.com/__api/bounties/search";
const MAX_PAGES = 5;
const PAGE_SIZE = 50;

router.get("/matcherino/events", async (_req, res) => {
  try {
    const events: unknown[] = [];
    let url: string | null = `${MATCHERINO_API}?pageSize=${PAGE_SIZE}`;

    for (let page = 0; page < MAX_PAGES && url !== null; page++) {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = (await response.json()) as {
        status: number;
        body: {
          contents: Array<{
            id: number;
            creator: { id: number };
            [key: string]: unknown;
          }>;
          moreAfter: boolean;
          links: { next?: string };
        };
      };

      if (data.status !== 200) break;

      const filtered = data.body.contents.filter(
        (item) => item.creator.id === MATCHERINO_USER_ID,
      );
      events.push(...filtered);

      url = data.body.moreAfter && data.body.links.next
        ? data.body.links.next
        : null;
    }

    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch Matcherino events" });
  }
});

export default router;
