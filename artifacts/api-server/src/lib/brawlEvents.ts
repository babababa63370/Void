export interface BrawlEvent {
  startTime: string;
  endTime: string;
  event: {
    id: number;
    mode: string;
    modeId: number | null;
    map: string;
    mapImage: string | null;
    modeIcon: string | null;
  };
  slot: {
    id: number | null;
    name: string | null;
    emoji: string | null;
    hash: string | null;
    listAlone: boolean | null;
    hideable: boolean | null;
    hideForLevel: number | null;
    background: string | null;
  };
}

const API_URL = "https://api.meonix.me/api/events/rotation";
const CACHE_MS = 60_000;

let cache: { data: BrawlEvent[]; fetchedAt: number } | null = null;

export async function getBrawlRotation(): Promise<BrawlEvent[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_MS) return cache.data;
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`Brawl API ${res.status}`);
  const json = (await res.json()) as { rotation: BrawlEvent[] };
  cache = { data: json.rotation ?? [], fetchedAt: Date.now() };
  return cache.data;
}

/** Parse "20260421T180000.000Z" → Date. */
export function parseApiTime(s: string | null | undefined): Date {
  if (!s) return new Date(NaN);
  const m = s.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(?:\.(\d{3}))?Z$/);
  if (!m) return new Date(s);
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}.${m[7] ?? "000"}Z`);
}

export function getActiveEvents(events: BrawlEvent[]): BrawlEvent[] {
  const now = Date.now();
  return events.filter((e) => {
    const start = parseApiTime(e.startTime).getTime();
    const end = parseApiTime(e.endTime).getTime();
    return !isNaN(start) && !isNaN(end) && start <= now && now < end;
  });
}

/** "soloShowdown" → "Solo Showdown" */
export function prettyMode(mode: string): string {
  if (!mode) return "Event";
  return mode
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
