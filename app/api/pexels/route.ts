import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const page = req.nextUrl.searchParams.get("page") ?? "1";

  if (!q) return NextResponse.json({ photos: [] });

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=80&page=${page}&orientation=landscape`,
    { headers: { Authorization: process.env.PEXELS_API_KEY ?? "" } }
  );

  if (!res.ok) return NextResponse.json({ photos: [] }, { status: res.status });

  const data = await res.json();
  return NextResponse.json({
    photos: (data.photos ?? []).map((p: {
      id: number;
      src: { large2x: string; medium: string };
      alt: string;
      photographer: string;
      url: string;
    }) => ({
      id: p.id,
      src: p.src.large2x,
      thumb: p.src.medium,
      alt: p.alt,
      photographer: p.photographer,
      pexelsUrl: p.url,
    })),
    totalResults: data.total_results,
    nextPage: data.next_page,
  });
}
