import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/app/(dashboard)/articles/[id]/article-editor";

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: { site: { include: { authors: { orderBy: { name: "asc" } } } } },
  });

  if (!article) notFound();

  return <ArticleEditor article={article} />;
}
