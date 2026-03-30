import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, bio, avatar } = body as {
    name?: string;
    bio?: string;
    avatar?: string;
  };

  const data: Record<string, string | null> = {};
  if (name !== undefined) {
    data.name = name;
    data.slug = name.toLowerCase().replace(/\s+/g, "-");
  }
  if (bio !== undefined) data.bio = bio || null;
  if (avatar !== undefined) data.avatar = avatar || null;

  const author = await db.author.update({ where: { id }, data });
  return NextResponse.json(author);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.author.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
