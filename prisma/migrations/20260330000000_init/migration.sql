-- CreateTable
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "githubRepo" TEXT NOT NULL,
    "repoBranch" TEXT NOT NULL DEFAULT 'main',
    "contentPath" TEXT NOT NULL DEFAULT 'content/blog',
    "contentTypes" TEXT,
    "assetsPath" TEXT NOT NULL DEFAULT 'public/images/blog',
    "imageWidth" INTEGER NOT NULL DEFAULT 1200,
    "imageHeight" INTEGER NOT NULL DEFAULT 800,
    "description" TEXT,
    "logo" TEXT,
    "faviconUrl" TEXT,
    "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
    "brandVoice" TEXT,
    "tone" TEXT,
    "targetAudience" TEXT,
    "externalLinksPath" TEXT,
    "authorsPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
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
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "errorLog" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Site_slug_key" ON "Site"("slug");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Author_siteId_slug_key" ON "Author"("siteId", "slug");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "Article_siteId_slug_key" ON "Article"("siteId", "slug");

-- AddForeignKey
ALTER TABLE "Author" ADD CONSTRAINT "Author_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
