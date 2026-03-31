import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const settings = await db.settings.findUnique({ where: { id: "global" } });
  return NextResponse.json(settings ?? { id: "global", systemPrompt: null });
}

export async function PATCH(req: NextRequest) {
  const { systemPrompt } = await req.json();

  const settings = await db.settings.upsert({
    where: { id: "global" },
    update: { systemPrompt },
    create: { id: "global", systemPrompt },
  });

  return NextResponse.json(settings);
}
