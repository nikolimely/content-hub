import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DocsViewer } from "./docs-viewer";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await db.site.findUnique({
    where: { slug },
    select: { slug: true, name: true, model: true },
  });
  if (!site) notFound();

  return (
    <Suspense>
      <DocsViewer siteSlug={slug} siteName={site.name} model={site.model} />
    </Suspense>
  );
}
