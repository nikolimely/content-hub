-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "githubRepo" TEXT NOT NULL,
    "repoBranch" TEXT NOT NULL DEFAULT 'main',
    "contentPath" TEXT NOT NULL DEFAULT 'content/blog',
    "contentTypes" TEXT,
    "assetsPath" TEXT NOT NULL DEFAULT 'public/images/blog',
    "description" TEXT,
    "logo" TEXT,
    "faviconUrl" TEXT,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "brandVoice" TEXT,
    "tone" TEXT,
    "targetAudience" TEXT,
    "externalLinksPath" TEXT,
    "authorsPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Site" ("assetsPath", "authorsPath", "brandVoice", "contentPath", "contentTypes", "createdAt", "description", "domain", "externalLinksPath", "faviconUrl", "githubRepo", "id", "logo", "name", "repoBranch", "slug", "targetAudience", "tone", "updatedAt") SELECT "assetsPath", "authorsPath", "brandVoice", "contentPath", "contentTypes", "createdAt", "description", "domain", "externalLinksPath", "faviconUrl", "githubRepo", "id", "logo", "name", "repoBranch", "slug", "targetAudience", "tone", "updatedAt" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
