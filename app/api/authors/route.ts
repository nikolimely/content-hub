import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { siteId, name, bio, avatar } = body as {
    siteId: string;
    name: string;
    bio?: string;
    avatar?: string;
  };

  if (!siteId || !name) {
    return NextResponse.json({ error: "siteId and name required" }, { status: 400 });
  }

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const author = await db.author.upsert({
    where: { siteId_slug: { siteId, slug } },
    create: { siteId, name, slug, bio: bio ?? null, avatar: avatar ?? null },
    update: { name, bio: bio ?? null, avatar: avatar ?? null },
  });

  return NextResponse.json(author, { status: 201 });
}
