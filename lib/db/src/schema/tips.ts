import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const tipsTable = pgTable("tips", {
  id: serial("id").primaryKey(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull().default("EUR"),
  donorName: text("donor_name"),
  message: text("message"),
  source: text("source").notNull().default("manual"),
  externalId: text("external_id"),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Tip = typeof tipsTable.$inferSelect;
export type NewTip = typeof tipsTable.$inferInsert;
