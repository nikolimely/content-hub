import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const article = await db.article.findUnique({
    where: { id },
    include: { site: true },
  });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(article);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { content, status, metaDescription, heroImage, scheduledAt } = body;

  const article = await db.article.update({
    where: { id },
    data: {
      ...(content !== undefined && { content }),
      ...(status !== undefined && { status }),
      ...(metaDescription !== undefined && { metaDescription }),
      ...(heroImage !== undefined && { heroImage }),
      ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
    },
  });

  return NextResponse.json(article);
}
