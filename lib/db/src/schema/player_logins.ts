import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const playerLoginsTable = pgTable("player_logins", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull(),
  username: text("username").notNull(),
  discriminator: text("discriminator").default(""),
  avatar: text("avatar"),
  role: text("role").default("none"), // "none" | "alpha" | "omega" | "staff"
  country: text("country").default(""),
  brawlTag: text("brawl_tag").default(""),
  bio: text("bio").default(""),
  favoriteModes: text("favorite_modes").default(""),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
});

export type PlayerLogin = typeof playerLoginsTable.$inferSelect;
