import { pgTable, serial, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";

export const researchRuns = pgTable("research_runs", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  status: text("status").notNull().default("pending"), // pending | running | completed | failed
  articleCount: integer("article_count").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  researchRunId: integer("research_run_id")
    .notNull()
    .references(() => researchRuns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source").notNull().default("unknown"),
  publishedDate: text("published_date"),
  snippet: text("snippet"),
  aiSummary: text("ai_summary"),
  aiAnalysis: text("ai_analysis"),
  importance: integer("importance").notNull().default(3), // 1-5 scale
  starred: boolean("starred").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
