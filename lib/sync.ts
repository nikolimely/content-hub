import { load as parseYaml } from "js-yaml";
import { getFileContent, listDirectory } from "./github";
import { db } from "./db";

function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseFrontmatter(raw: string): Record<string, unknown> {
  const match = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  try {
    return (parseYaml(match[1]) as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

function parseAuthorsFile(
  content: string,
  domain: string
): { name: string; slug: string; bio: string | null; avatar: string | null }[] {
  // Works for TS/JS files that define an authors array with firstName, fullName, slug, image, bio, shortBio
  const results: { name: string; slug: string; bio: string | null; avatar: string | null }[] = [];
  // Split on object boundaries by firstName field
  const blocks = content.split(/(?=[\s{,]firstName:)/);
  for (const block of blocks) {
    const firstName = block.match(/firstName:\s*"([^"]+)"/)?.[1];
    if (!firstName) continue;
    const fullName = block.match(/fullName:\s*"([^"]+)"/)?.[1];
    const slug = block.match(/\bslug:\s*"([^"]+)"/)?.[1];
    const image = block.match(/\bimage:\s*"([^"]+)"/)?.[1];
    const shortBio = block.match(/shortBio:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
    const bio = block.match(/(?<!short)Bio:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
    const name = fullName || firstName;
    const rawImage = image ?? null;
    const avatar = rawImage
      ? rawImage.startsWith("http")
        ? rawImage
        : `https://${domain}${rawImage}`
      : null;
    results.push({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      bio: shortBio || bio || null,
      avatar,
    });
  }
  return results;
}

function parseContentPlanTable(markdown: string): {
  title: string;
  keyword: string;
  type: string;
  category: string;
  scheduled: string | null;
}[] {
  const lines = markdown.split("\n");
  const tableLines = lines.filter(
    (l) => l.trim().startsWith("|") && !l.includes("---")
  );

  // First line is header, rest are data rows
  const dataRows = tableLines.slice(1);

  return dataRows
    .map((line) => {
      const cols = line
        .split("|")
        .map((c) => c.trim())
        .filter(Boolean);
      if (cols.length < 4) return null;
      const [title, keyword, type, category, scheduled] = cols;
      return {
        title,
        keyword,
        type: type || "post",
        category: category || "SEO",
        scheduled: scheduled && scheduled.match(/^\d{4}-\d{2}-\d{2}$/)
          ? scheduled
          : null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null && Boolean(r.title));
}

export type SyncResult = {
  settings: boolean;
  articlesImported: number;
  articlesSkipped: number;
  existingSynced: number;
  errors: string[];
};

export async function syncSiteFromCms(siteId: string): Promise<SyncResult> {
  const site = await db.site.findUnique({ where: { id: siteId } });
  if (!site) throw new Error("Site not found");

  const result: SyncResult = {
    settings: false,
    articlesImported: 0,
    articlesSkipped: 0,
    existingSynced: 0,
    errors: [],
  };

  // 1. Sync settings from cms/settings.md
  try {
    const settingsRaw = await getFileContent(
      site.githubRepo,
      "cms/settings.md",
      site.repoBranch
    );
    if (settingsRaw) {
      const fm = parseFrontmatter(settingsRaw);
      await db.site.update({
        where: { id: siteId },
        data: {
          description: (fm.description as string) ?? site.description,
          logo: (fm.logo as string) ?? site.logo,
          brandVoice: (fm.brandVoice as string) ?? site.brandVoice,
          tone: (fm.tone as string) ?? site.tone,
          targetAudience: (fm.targetAudience as string) ?? site.targetAudience,
          authorsPath: (fm.authorsPath as string) ?? site.authorsPath,
          contentTypes: fm.contentTypes
            ? JSON.stringify(fm.contentTypes)
            : site.contentTypes,
        },
      });

      // Sync authors from authorsPath file if set
      const authorsPath = (fm.authorsPath as string) ?? site.authorsPath;
      if (authorsPath) {
        const authorsRaw = await getFileContent(site.githubRepo, authorsPath, site.repoBranch);
        if (authorsRaw) {
          const parsed = parseAuthorsFile(authorsRaw, site.domain);
          for (const a of parsed) {
            await db.author.upsert({
              where: { siteId_slug: { siteId, slug: a.slug } },
              create: { siteId, name: a.name, slug: a.slug, bio: a.bio, avatar: a.avatar },
              update: { name: a.name, bio: a.bio, avatar: a.avatar },
            });
          }
        }
      } else {
        // Fall back to simple name list from settings
        const authorList = fm.authors as string[] | undefined;
        if (Array.isArray(authorList)) {
          for (const name of authorList) {
            const slug = name.toLowerCase().replace(/\s+/g, "-");
            await db.author.upsert({
              where: { siteId_slug: { siteId, slug } },
              create: { siteId, name, slug },
              update: { name },
            });
          }
        }
      }

      result.settings = true;
    }
  } catch (e) {
    result.errors.push(`Settings: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Import content plan from cms/content-plan.md
  try {
    const planRaw = await getFileContent(
      site.githubRepo,
      "cms/content-plan.md",
      site.repoBranch
    );
    if (planRaw) {
      const rows = parseContentPlanTable(planRaw);
      for (const row of rows) {
        const slug = toSlug(row.title);
        const existing = await db.article.findUnique({
          where: { siteId_slug: { siteId, slug } },
        });
        if (existing) {
          result.articlesSkipped++;
          continue;
        }
        await db.article.create({
          data: {
            siteId,
            title: row.title,
            slug,
            keyword: row.keyword,
            contentType: row.type,
            status: "planned",
            scheduledAt: row.scheduled ? new Date(row.scheduled) : null,
          },
        });
        result.articlesImported++;
      }
    }
  } catch (e) {
    result.errors.push(`Content plan: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Sync existing published content from repo
  try {
    const updatedSite = await db.site.findUnique({ where: { id: siteId } });
    const contentDirs: string[] = [];

    // Parse contentTypes if set, otherwise use contentPath
    if (updatedSite?.contentTypes) {
      try {
        const types = JSON.parse(updatedSite.contentTypes) as { path: string }[];
        contentDirs.push(...types.map((t) => t.path));
      } catch {
        contentDirs.push(updatedSite.contentPath);
      }
    } else {
      contentDirs.push(updatedSite?.contentPath ?? site.contentPath);
    }

    for (const dir of contentDirs) {
      const files = await listDirectory(site.githubRepo, dir, site.repoBranch);
      const mdxFiles = files.filter(
        (f) => f.type === "file" && (f.name.endsWith(".mdx") || f.name.endsWith(".md"))
      );

      for (const file of mdxFiles) {
        const slug = file.name.replace(/\.(mdx?|md)$/, "");
        const existing = await db.article.findUnique({
          where: { siteId_slug: { siteId, slug } },
        });

        // Read frontmatter to get title/author/category
        const content = await getFileContent(
          site.githubRepo,
          file.path,
          site.repoBranch
        );
        const fm = content ? parseFrontmatter(content) : {};
        const category = (fm.category as string) || null;
        const authorName = fm.author as string | undefined;

        // Resolve authorId — match by first name (case-insensitive) since frontmatter uses first names
        let authorId: string | null = null;
        if (authorName) {
          const firstName = authorName.trim().toLowerCase();
          const author = await db.author.findFirst({
            where: {
              siteId,
              name: { contains: firstName },
            },
          });
          // Verify it's actually a first-name match (not a substring coincidence)
          if (author && author.name.toLowerCase().startsWith(firstName)) {
            authorId = author.id;
          }
        }

        const frontmatterDate = fm.date ? new Date(fm.date as string) : null;
        const isFuture = frontmatterDate && frontmatterDate > new Date();

        if (existing) {
          await db.article.update({
            where: { id: existing.id },
            data: {
              authorId: authorId ?? existing.authorId,
              category: category ?? existing.category,
              scheduledAt: frontmatterDate ?? existing.scheduledAt,
              publishedAt: frontmatterDate && !isFuture ? frontmatterDate : existing.publishedAt,
            },
          });
          result.existingSynced++;
          continue;
        }

        const title = (fm.title as string) || slug;
        const keyword = (fm.description as string)?.split(" ").slice(0, 4).join(" ") || slug;

        await db.article.create({
          data: {
            siteId,
            title,
            slug,
            keyword,
            category,
            status: "published",
            content: content ?? null,
            authorId,
            scheduledAt: frontmatterDate,
            publishedAt: isFuture ? null : (frontmatterDate ?? new Date()),
          },
        });
        result.existingSynced++;
      }
    }
  } catch (e) {
    result.errors.push(`Existing content: ${e instanceof Error ? e.message : String(e)}`);
  }

  return result;
}
