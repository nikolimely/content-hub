import { db } from "@/lib/db";
import { ScheduleCalendar } from "./schedule-calendar";

export default async function SchedulePage() {
  const scheduled = await db.article.findMany({
    where: { scheduledAt: { not: null } },
    orderBy: { scheduledAt: "asc" },
    include: { site: true },
  });

  const unscheduled = await db.article.findMany({
    where: { scheduledAt: null, status: { not: "published" } },
    orderBy: { createdAt: "asc" },
    include: { site: true },
  });

  const articles = scheduled.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    scheduledAt: a.scheduledAt!.toISOString(),
    site: { slug: a.site.slug, name: a.site.name, domain: a.site.domain, faviconUrl: a.site.faviconUrl },
  }));

  const unscheduledArticles = unscheduled.map((a) => ({
    id: a.id,
    title: a.title,
    status: a.status,
    site: { slug: a.site.slug, name: a.site.name, domain: a.site.domain, faviconUrl: a.site.faviconUrl },
  }));

  return <ScheduleCalendar articles={articles} unscheduled={unscheduledArticles} />;
}
