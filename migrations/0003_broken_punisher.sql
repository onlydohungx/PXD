CREATE TABLE "movie_daily_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"movie_slug" text NOT NULL,
	"view_date" timestamp NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"categories" json DEFAULT '{}'::json,
	"countries" json DEFAULT '{}'::json,
	"last_updated" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"movie_slugs" text[] NOT NULL,
	"based_on_categories" text[] NOT NULL,
	"based_on_countries" text[] NOT NULL,
	"confidence_score" integer DEFAULT 70,
	"created_at" timestamp DEFAULT now(),
	"is_viewed" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "watch_history" ADD COLUMN "current_time" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "watch_history" ADD COLUMN "duration" double precision DEFAULT 0;--> statement-breakpoint
ALTER TABLE "watch_history" ADD COLUMN "progress" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_recommendations" ADD CONSTRAINT "user_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;