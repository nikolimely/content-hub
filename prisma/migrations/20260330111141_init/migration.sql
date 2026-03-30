-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "repoPath" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
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
    CONSTRAINT "Article_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_siteId_slug_key" ON "Article"("siteId", "slug");
