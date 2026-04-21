import { pgTable, serial, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";

export const moderationLogsTable = pgTable(
  "moderation_logs",
  {
    id: serial("id").primaryKey(),
    action: text("action").notNull(), // ban | unban | kick | mute | unmute | move
    guildId: text("guild_id"),
    targetId: text("target_id").notNull(),
    targetUsername: text("target_username"),
    moderatorId: text("moderator_id").notNull(),
    moderatorUsername: text("moderator_username"),
    reason: text("reason"),
    durationSec: text("duration_sec"), // null for non-timed actions
    extra: jsonb("extra"), // action-specific metadata (e.g. channel moved to)
    dmDelivered: text("dm_delivered"), // "yes" | "no" | "na"
    success: text("success").notNull().default("yes"), // "yes" | "no"
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    createdAtIdx: index("moderation_logs_created_at_idx").on(t.createdAt),
    actionIdx: index("moderation_logs_action_idx").on(t.action),
  }),
);

export type ModerationLog = typeof moderationLogsTable.$inferSelect;
export type NewModerationLog = typeof moderationLogsTable.$inferInsert;
