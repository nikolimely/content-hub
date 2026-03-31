CREATE TABLE "Settings" (
  "id" TEXT NOT NULL DEFAULT 'global',
  "systemPrompt" TEXT,
  CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "Settings" ("id") VALUES ('global') ON CONFLICT DO NOTHING;
