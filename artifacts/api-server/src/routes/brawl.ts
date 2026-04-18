import { Router } from "express";

const router = Router();

router.get("/brawl/player/:tag", async (req, res) => {
  const raw = req.params.tag;
  const tag = raw.startsWith("#") ? raw : `#${raw}`;
  const encoded = encodeURIComponent(tag);

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const apiKey = process.env.BRAWLAPI_TOKEN ?? process.env.BRAWL_API_KEY;
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const response = await fetch(
      `https://api.brawlapi.com/v1/players/${encoded}`,
      { headers },
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    return res.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ error: msg });
  }
});

export default router;
