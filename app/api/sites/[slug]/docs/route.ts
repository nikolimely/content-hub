import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listDirectory, getFileContent, getFileSha, putFile } from "@/lib/github";

// Files in cms/ root to exclude from the docs viewer
const EXCLUDED = new Set(["settings.md", "external-links.md", "redirects.md"]);

async function listDocs(
  repo: string,
  branch: string,
  path: string,
  prefix = ""
): Promise<{ path: string; name: string; label: string }[]> {
  const entries = await listDirectory(repo, path, branch);
  const results: { path: string; name: string; label: string }[] = [];

  for (const entry of entries) {
    if (entry.type === "file" && entry.name.endsWith(".md")) {
      if (prefix === "" && EXCLUDED.has(entry.name)) continue;
      results.push({
        path: entry.path,
        name: entry.name,
        label: prefix ? `${prefix}/${entry.name}` : entry.name,
      });
    } else if (entry.type === "dir") {
      const nested = await listDocs(repo, branch, entry.path, prefix ? `${prefix}/${entry.name}` : entry.name);
      results.push(...nested);
    }
  }

  return results;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const file = req.nextUrl.searchParams.get("file");

  const site = await db.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Return file content
  if (file) {
    const content = await getFileContent(site.githubRepo, file, site.repoBranch);
    if (!content) return NextResponse.json({ error: "File not found" }, { status: 404 });
    return NextResponse.json({ content });
  }

  // List all docs under cms/
  const docs = await listDocs(site.githubRepo, site.repoBranch, "cms");
  return NextResponse.json({ docs });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { file, content } = await req.json();

  if (!file || content == null) {
    return NextResponse.json({ error: "Missing file or content" }, { status: 400 });
  }

  const site = await db.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sha = await getFileSha(site.githubRepo, file, site.repoBranch);
  await putFile(
    site.githubRepo,
    file,
    content,
    site.repoBranch,
    `docs: update ${file.split("/").pop()}`,
    sha
  );

  return NextResponse.json({ ok: true });
}
