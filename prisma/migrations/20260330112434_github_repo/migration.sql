/*
  Warnings:

  - You are about to drop the column `repoPath` on the `Site` table. All the data in the column will be lost.
  - Added the required column `githubRepo` to the `Site` table without a default value. This is not possible if the table is not empty.

*/
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
    "assetsPath" TEXT NOT NULL DEFAULT 'public/images/blog',
    "brandVoice" TEXT,
    "tone" TEXT,
    "targetAudience" TEXT,
    "externalLinksPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Site" ("assetsPath", "brandVoice", "contentPath", "createdAt", "domain", "externalLinksPath", "id", "name", "repoBranch", "slug", "targetAudience", "tone", "updatedAt") SELECT "assetsPath", "brandVoice", "contentPath", "createdAt", "domain", "externalLinksPath", "id", "name", "repoBranch", "slug", "targetAudience", "tone", "updatedAt" FROM "Site";
DROP TABLE "Site";
ALTER TABLE "new_Site" RENAME TO "Site";
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
