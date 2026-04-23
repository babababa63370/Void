import { pgTable, serial, text, integer, timestamp, index } from "drizzle-orm/pg-core";

export const recruitmentApplicationsTable = pgTable(
  "recruitment_applications",
  {
    id: serial("id").primaryKey(),
    discordId: text("discord_id").notNull(),
    discordUsername: text("discord_username"),
    guildId: text("guild_id").notNull(),
    channelId: text("channel_id").notNull().unique(),
    division: text("division").notNull(), // alpha | omega | nexus
    step: text("step").notNull().default("tag"), // tag | tag_confirm | trophies | ranked | ambitions | motivation | done
    lastBotMessageId: text("last_bot_message_id"),
    brawlTag: text("brawl_tag"),
    brawlName: text("brawl_name"),
    brawlIconId: integer("brawl_icon_id"),
    brawlTrophies: integer("brawl_trophies"),
    trophies: text("trophies"),
    ranked: text("ranked"),
    ambitions: text("ambitions"),
    motivation: text("motivation"),
    status: text("status").notNull().default("draft"), // draft | pending | accepted | refused | on_hold
    staffNote: text("staff_note"),
    reviewedBy: text("reviewed_by"),
    reviewedByUsername: text("reviewed_by_username"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    discordIdx: index("recruitment_apps_discord_id_idx").on(t.discordId),
    statusIdx: index("recruitment_apps_status_idx").on(t.status),
    channelIdx: index("recruitment_apps_channel_id_idx").on(t.channelId),
    createdAtIdx: index("recruitment_apps_created_at_idx").on(t.createdAt),
  }),
);

export type RecruitmentApplication = typeof recruitmentApplicationsTable.$inferSelect;
export type NewRecruitmentApplication = typeof recruitmentApplicationsTable.$inferInsert;
