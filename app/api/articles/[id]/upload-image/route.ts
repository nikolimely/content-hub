import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFileSha, putFileBase64 } from "@/lib/github";
import sharp from "sharp";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { pexelsUrl, alt, photographer, featured, filenameSuffix } = await req.json() as {
    pexelsUrl: string;
    alt?: string;
    photographer?: string;
    featured?: boolean;
    filenameSuffix?: string;
  };

  const article = await db.article.findUnique({
    where: { id },
    include: { site: true },
  });

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const imgRes = await fetch(pexelsUrl);
  if (!imgRes.ok) return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });

  const buffer = await imgRes.arrayBuffer();
  const imgWidth = article.site.imageWidth ?? 1200;
  const imgHeight = article.site.imageHeight ?? 800;

  const resized = sharp(Buffer.from(buffer)).resize(imgWidth, imgHeight, { fit: "cover", position: "center" });
  const [jpegBuffer, webpBuffer] = await Promise.all([
    resized.clone().jpeg({ quality: 82 }).toBuffer(),
    resized.clone().webp({ quality: 82 }).toBuffer(),
  ]);

  const assetsPath = article.site.assetsPath ?? "public/images/blog";
  // Featured images go in /featured/ subfolder; inline images use a user-supplied word
  const filename = featured
    ? `${article.slug}.jpg`
    : `${article.slug}-${filenameSuffix ?? "image"}.jpg`;
  const filePath = featured
    ? `${assetsPath}/featured/${filename}`
    : `${assetsPath}/${filename}`;
  const webpFilePath = filePath.replace(/\.jpg$/, ".webp");

  const [sha, webpSha] = await Promise.all([
    getFileSha(article.site.githubRepo, filePath, article.site.repoBranch),
    getFileSha(article.site.githubRepo, webpFilePath, article.site.repoBranch),
  ]);

  await Promise.all([
    putFileBase64(article.site.githubRepo, filePath, jpegBuffer.toString("base64"), article.site.repoBranch, `asset: add ${filename} for ${article.slug}`, sha ?? undefined),
    putFileBase64(article.site.githubRepo, webpFilePath, webpBuffer.toString("base64"), article.site.repoBranch, `asset: add ${filename.replace(/\.jpg$/, ".webp")} for ${article.slug}`, webpSha ?? undefined),
  ]);

  const publicPath = `/${filePath.replace(/^public\//, "")}`;
  const credit = photographer ? `Photo by [${photographer}](https://www.pexels.com) on Pexels` : null;

  return NextResponse.json({ path: publicPath, alt: alt ?? "", credit });
}
