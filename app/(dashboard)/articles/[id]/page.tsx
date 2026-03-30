import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

export default async function ArticleRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: { site: true },
  });

  if (!article) notFound();

  redirect(`/sites/${article.site.slug}/articles/${id}`);
}
