import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const playerLoginsTable = pgTable("player_logins", {
  id: serial("id").primaryKey(),
  discordTag: text("discord_tag").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPlayerLoginSchema = createInsertSchema(playerLoginsTable).omit({ id: true, createdAt: true });
export type InsertPlayerLogin = z.infer<typeof insertPlayerLoginSchema>;
export type PlayerLogin = typeof playerLoginsTable.$inferSelect;
