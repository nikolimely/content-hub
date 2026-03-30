import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFileContent, getFileSha, putFile } from "@/lib/github";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { newSlug } = await req.json() as { newSlug: string };

  if (!newSlug) {
    return NextResponse.json({ error: "newSlug required" }, { status: 400 });
  }

  const article = await db.article.findUnique({
    where: { id },
    include: { site: true },
  });

  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (article.status !== "published") {
    return NextResponse.json({ error: "Article is not published" }, { status: 400 });
  }

  const { site } = article;
  const oldSlug = article.slug;

  // Determine content path — use first contentType path or fallback
  let contentDir = site.contentPath;
  if (site.contentTypes) {
    try {
      const types = JSON.parse(site.contentTypes) as { path: string }[];
      if (types[0]?.path) contentDir = types[0].path;
    } catch { /* ignore */ }
  }

  // Find old file (try .mdx then .md)
  let oldPath: string | null = null;
  let fileContent: string | null = null;
  for (const ext of [".mdx", ".md"]) {
    const path = `${contentDir}/${oldSlug}${ext}`;
    const content = await getFileContent(site.githubRepo, path, site.repoBranch);
    if (content) { oldPath = path; fileContent = content; break; }
  }

  if (!oldPath || !fileContent) {
    return NextResponse.json({ error: "Could not find published file in repo" }, { status: 404 });
  }

  const ext = oldPath.endsWith(".mdx") ? ".mdx" : ".md";
  const newPath = `${contentDir}/${newSlug}${ext}`;

  try {
    // 1. Create new file with same content
    await putFile(
      site.githubRepo,
      newPath,
      fileContent,
      site.repoBranch,
      `rename: ${oldSlug} → ${newSlug}`
    );

    // 2. Delete old file
    const oldSha = await getFileSha(site.githubRepo, oldPath, site.repoBranch);
    if (oldSha) {
      const token = getTokenForRepo(site.githubRepo);
      await fetch(
        `https://api.github.com/repos/${site.githubRepo}/contents/${oldPath}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `delete: ${oldSlug} (renamed to ${newSlug})`,
            sha: oldSha,
            branch: site.repoBranch,
          }),
        }
      );
    }

    // 3. Append redirect to cms/redirects.md
    await appendRedirect(site.githubRepo, site.repoBranch, oldSlug, newSlug, site.contentTypes);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function getTokenForRepo(repo: string): string {
  const org = repo.split("/")[0];
  return process.env[`${org.toUpperCase()}_GITHUB_TOKEN`] ?? process.env.GITHUB_TOKEN ?? "";
}

async function appendRedirect(
  repo: string,
  branch: string,
  oldSlug: string,
  newSlug: string,
  contentTypesJson: string | null
) {
  // Derive the URL prefix from contentTypes
  let urlPrefix = "/blog";
  if (contentTypesJson) {
    try {
      const types = JSON.parse(contentTypesJson) as { url?: string }[];
      if (types[0]?.url) urlPrefix = types[0].url;
    } catch { /* ignore */ }
  }

  const oldUrl = `${urlPrefix}/${oldSlug}`;
  const newUrl = `${urlPrefix}/${newSlug}`;
  const redirectsPath = "cms/redirects.md";

  const existing = await getFileContent(repo, redirectsPath, branch);
  const date = new Date().toISOString().split("T")[0];
  const newRow = `| \`${oldUrl}\` | \`${newUrl}\` | Slug renamed ${date} |`;

  let updated: string;
  if (existing) {
    updated = existing.trimEnd() + "\n" + newRow + "\n";
  } else {
    updated =
      "# CMS Redirects\n\nSlug renames managed by the content dashboard.\n\n" +
      "| Old URL | New URL | Notes |\n|---|---|---|\n" +
      newRow + "\n";
  }

  const sha = await getFileSha(repo, redirectsPath, branch);
  await putFile(repo, redirectsPath, updated, branch, `redirect: ${oldUrl} → ${newUrl}`, sha);
}
