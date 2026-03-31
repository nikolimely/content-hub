import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getFileSha, putFile } from "@/lib/github";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const site = await db.site.findUnique({ where: { slug } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(site);
}

function buildSettingsMd(site: {
  name: string;
  domain: string;
  description: string | null;
  logo: string | null;
  faviconUrl: string | null;
  model: string;
  brandVoice: string | null;
  tone: string | null;
  targetAudience: string | null;
  authorsPath: string | null;
  contentTypes: string | null;
  imageWidth: number;
  imageHeight: number;
}): string {
  type ContentType = { label: string; path: string; url?: string };
  let contentTypesList = "";
  if (site.contentTypes) {
    try {
      const types: ContentType[] = JSON.parse(site.contentTypes);
      if (types.length > 0) {
        contentTypesList =
          "\ncontentTypes:\n" +
          types
            .map(
              (t) =>
                `  - label: ${t.label}\n    path: ${t.path}${t.url ? `\n    url: ${t.url}` : ""}`
            )
            .join("\n");
      }
    } catch {}
  }

  const fields = [
    `name: ${site.name}`,
    `domain: ${site.domain}`,
    site.description ? `description: ${site.description}` : null,
    site.logo ? `logo: ${site.logo}` : null,
    site.faviconUrl ? `favicon: ${site.faviconUrl}` : null,
    `model: ${site.model}`,
    site.brandVoice ? `brandVoice: ${site.brandVoice}` : null,
    site.tone ? `tone: ${site.tone}` : null,
    site.targetAudience ? `targetAudience: ${site.targetAudience}` : null,
    site.authorsPath ? `authorsPath: ${site.authorsPath}` : null,
    `imageSize: ${site.imageWidth}x${site.imageHeight}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `---\n${fields}${contentTypesList}\n---\n`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await req.json();

  const {
    name,
    domain,
    description,
    logo,
    faviconUrl,
    githubRepo,
    repoBranch,
    contentPath,
    assetsPath,
    authorsPath,
    contentTypes,
    model,
    brandVoice,
    tone,
    targetAudience,
    externalLinksPath,
    deployHook,
    sitemapUrl,
  } = body;

  try {
    const site = await db.site.update({
      where: { slug },
      data: {
        ...(name !== undefined && { name }),
        ...(domain !== undefined && { domain }),
        ...(description !== undefined && { description: description || null }),
        ...(logo !== undefined && { logo: logo || null }),
        ...(faviconUrl !== undefined && { faviconUrl: faviconUrl || null }),
        ...(githubRepo !== undefined && { githubRepo }),
        ...(repoBranch !== undefined && { repoBranch }),
        ...(contentPath !== undefined && { contentPath }),
        ...(assetsPath !== undefined && { assetsPath }),
        ...(authorsPath !== undefined && { authorsPath: authorsPath || null }),
        ...(contentTypes !== undefined && { contentTypes: contentTypes || null }),
        ...(model !== undefined && { model }),
        ...(brandVoice !== undefined && { brandVoice: brandVoice || null }),
        ...(tone !== undefined && { tone: tone || null }),
        ...(targetAudience !== undefined && { targetAudience: targetAudience || null }),
        ...(externalLinksPath !== undefined && { externalLinksPath: externalLinksPath || null }),
        ...(deployHook !== undefined && { deployHook: deployHook || null }),
        ...(sitemapUrl !== undefined && { sitemapUrl: sitemapUrl || null }),
    ...(body.imageWidth !== undefined && { imageWidth: body.imageWidth }),
    ...(body.imageHeight !== undefined && { imageHeight: body.imageHeight }),
      },
    });

    // Commit updated settings.md back to repo
    let commitUrl: string | null = null;
    let commitSha: string | null = null;
    let repoError: string | null = null;

    try {
      const settingsMd = buildSettingsMd(site);
      const sha = await getFileSha(site.githubRepo, "cms/settings.md", site.repoBranch);
      const result = await putFile(
        site.githubRepo,
        "cms/settings.md",
        settingsMd,
        site.repoBranch,
        "cms: update settings",
        sha
      );
      commitUrl = result?.commitUrl ?? null;
      commitSha = result?.commitSha ?? null;
    } catch (e) {
      repoError = e instanceof Error ? e.message : "Repo commit failed";
    }

    return NextResponse.json({ ...site, commitUrl, commitSha, repoError });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
