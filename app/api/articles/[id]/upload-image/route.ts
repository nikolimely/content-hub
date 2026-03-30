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

  const processed = await sharp(Buffer.from(buffer))
    .resize(imgWidth, imgHeight, { fit: "cover", position: "center" })
    .jpeg({ quality: 82 })
    .toBuffer();
  const base64 = processed.toString("base64");

  const assetsPath = article.site.assetsPath ?? "public/images/blog";
  // Featured images go in /featured/ subfolder; inline images use a user-supplied word
  const filename = featured
    ? `${article.slug}.jpg`
    : `${article.slug}-${filenameSuffix ?? "image"}.jpg`;
  const filePath = featured
    ? `${assetsPath}/featured/${filename}`
    : `${assetsPath}/${filename}`;

  const sha = await getFileSha(article.site.githubRepo, filePath, article.site.repoBranch);
  await putFileBase64(
    article.site.githubRepo,
    filePath,
    base64,
    article.site.repoBranch,
    `asset: add ${filename} for ${article.slug}`,
    sha ?? undefined
  );

  const publicPath = `/${filePath.replace(/^public\//, "")}`;
  const credit = photographer ? `Photo by [${photographer}](https://www.pexels.com) on Pexels` : null;

  return NextResponse.json({ path: publicPath, alt: alt ?? "", credit });
}
