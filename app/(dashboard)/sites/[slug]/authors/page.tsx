import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthorForm } from "./author-form";
import { AuthorCard } from "./author-card";

export default async function AuthorsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await db.site.findUnique({
    where: { slug },
    include: {
      authors: {
        include: { _count: { select: { articles: true } } },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!site) notFound();

  return (
    <div className="p-8">
      <Link
        href={`/sites/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> {site.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#0F172A]">Authors</h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {site.authors.map((author) => (
          <AuthorCard key={author.id} author={author} siteSlug={slug} />
        ))}
        {site.authors.length === 0 && (
          <p className="text-sm text-[#94A3B8] col-span-3">
            No authors yet. Add one below or sync from the repo.
          </p>
        )}
      </div>

      <div className="border-t border-[#E2E8F0] pt-6">
        <h2 className="text-sm font-medium text-[#0F172A] mb-4">Add Author</h2>
        <AuthorForm siteId={site.id} siteSlug={slug} />
      </div>
    </div>
  );
}
