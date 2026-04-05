CREATE TABLE "articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"research_run_id" integer NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"source" text DEFAULT 'unknown' NOT NULL,
	"published_date" text,
	"snippet" text,
	"ai_summary" text,
	"ai_analysis" text,
	"importance" integer DEFAULT 3 NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "research_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"query" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"article_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_research_run_id_research_runs_id_fk" FOREIGN KEY ("research_run_id") REFERENCES "public"."research_runs"("id") ON DELETE cascade ON UPDATE no action;