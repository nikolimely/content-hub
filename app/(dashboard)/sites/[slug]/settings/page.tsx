import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await db.site.findUnique({ where: { slug } });
  if (!site) notFound();

  return <SettingsForm site={site} />;
}
