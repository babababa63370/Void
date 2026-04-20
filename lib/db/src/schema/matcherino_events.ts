import { pgTable, integer, text, timestamp, real, boolean } from "drizzle-orm/pg-core";

export const matcherinoEventsTable = pgTable("matcherino_events", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("tournament"),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  totalBalance: real("total_balance").notNull().default(0),
  participantsCount: integer("participants_count").notNull().default(0),
  heroImg: text("hero_img").notNull().default(""),
  backgroundImg: text("background_img").notNull().default(""),
  thumbnailImg: text("thumbnail_img").notNull().default(""),
  gameId: integer("game_id"),
  gameTitle: text("game_title"),
  gameImage: text("game_image"),
  gameSlug: text("game_slug"),
  finalizedAt: timestamp("finalized_at", { withTimezone: true }),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
  announced: boolean("announced").notNull().default(false),
  announcedAt: timestamp("announced_at", { withTimezone: true }),
});

export type MatcherinoEvent = typeof matcherinoEventsTable.$inferSelect;
