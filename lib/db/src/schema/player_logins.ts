import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playerLoginsTable = pgTable("player_logins", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull(),
  username: text("username").notNull(),
  discriminator: text("discriminator").default(""),
  avatar: text("avatar"),
  lastLoginAt: timestamp("last_login_at").defaultNow().notNull(),
});

export const insertPlayerLoginSchema = createInsertSchema(playerLoginsTable).omit({ id: true, lastLoginAt: true });
export type InsertPlayerLogin = z.infer<typeof insertPlayerLoginSchema>;
export type PlayerLogin = typeof playerLoginsTable.$inferSelect;
