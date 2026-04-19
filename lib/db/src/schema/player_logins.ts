import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const PLAYER_ROLES = ["alpha", "omega", "staff"] as const;
export type PlayerRole = typeof PLAYER_ROLES[number];

export const playerLoginsTable = pgTable("player_logins", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull(),
  username: text("username").notNull(),
  discriminator: text("discriminator").default(""),
  avatar: text("avatar"),
  roles: text("roles").array().notNull().default(sql`'{}'`),
  customAvatar: text("custom_avatar"),
  banner: text("banner"),
  background: text("background"),
  font: text("font"),
  music: text("music"),
  links: text("links"),
  brawlTag: text("brawl_tag"),
  backgroundVideo: text("background_video"),
  cardBackground: text("card_background"),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
});

export const insertPlayerLoginSchema = createInsertSchema(playerLoginsTable).omit({ id: true, lastLoginAt: true });
export type InsertPlayerLogin = z.infer<typeof insertPlayerLoginSchema>;
export type PlayerLogin = typeof playerLoginsTable.$inferSelect;
