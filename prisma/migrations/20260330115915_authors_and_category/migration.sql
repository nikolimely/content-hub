-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    CONSTRAINT "Author_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "authorId" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" TEXT,
    "contentType" TEXT NOT NULL DEFAULT 'post',
    "metaDescription" TEXT,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "content" TEXT,
    "heroImage" TEXT,
    "images" TEXT,
    "scheduledAt" DATETIME,
    "publishedAt" DATETIME,
    "errorLog" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Article_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Article" ("content", "contentType", "createdAt", "errorLog", "heroImage", "id", "images", "keyword", "metaDescription", "publishedAt", "scheduledAt", "siteId", "slug", "status", "title", "updatedAt") SELECT "content", "contentType", "createdAt", "errorLog", "heroImage", "id", "images", "keyword", "metaDescription", "publishedAt", "scheduledAt", "siteId", "slug", "status", "title", "updatedAt" FROM "Article";
DROP TABLE "Article";
ALTER TABLE "new_Article" RENAME TO "Article";
CREATE UNIQUE INDEX "Article_siteId_slug_key" ON "Article"("siteId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Author_siteId_slug_key" ON "Author"("siteId", "slug");
