import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const filePath = req.nextUrl.searchParams.get("path");
  if (!filePath) return new NextResponse("Missing path", { status: 400 });

  const article = await db.article.findUnique({
    where: { id },
    include: { site: true },
  });
  if (!article) return new NextResponse("Not found", { status: 404 });

  const { githubRepo, repoBranch } = article.site;
  const org = githubRepo.split("/")[0];
  const envKey = `${org.toUpperCase()}_GITHUB_TOKEN`;
  const token = process.env[envKey] ?? process.env.GITHUB_TOKEN ?? "";

  const rawUrl = `https://raw.githubusercontent.com/${githubRepo}/${repoBranch}/${filePath}`;
  const res = await fetch(rawUrl, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) return new NextResponse("Image not found", { status: 404 });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
