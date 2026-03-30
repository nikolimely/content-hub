import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listDirectory } from "@/lib/github";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const article = await db.article.findUnique({
    where: { id },
    include: { site: true },
  });

  if (!article) return NextResponse.json({ images: [] }, { status: 404 });

  const { githubRepo, repoBranch, assetsPath, domain } = article.site;
  const base = assetsPath ?? "public/images/blog";

  // List root + /featured subfolder in parallel
  const [rootFiles, featuredFiles] = await Promise.all([
    listDirectory(githubRepo, base, repoBranch),
    listDirectory(githubRepo, `${base}/featured`, repoBranch),
  ]);

  const toImage = (file: { name: string; path: string; type: string }, subfolder?: string) => {
    if (file.type !== "file") return null;
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!IMAGE_EXTS.includes(ext)) return null;
    const publicPath = `/${file.path.replace(/^public\//, "")}`;
    const rawUrl = `https://raw.githubusercontent.com/${githubRepo}/${repoBranch}/${file.path}`;
    const liveUrl = `https://${domain}${publicPath}`;
    const proxyPath = file.path;
    return { name: file.name, publicPath, rawUrl, liveUrl, proxyPath, subfolder: subfolder ?? "images" };
  };

  const images = [
    ...featuredFiles.map(f => toImage(f, "featured")),
    ...rootFiles.map(f => toImage(f, "images")),
  ].filter(Boolean);

  return NextResponse.json({ images });
}
