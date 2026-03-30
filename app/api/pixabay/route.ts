import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const page = req.nextUrl.searchParams.get("page") ?? "1";

  if (!q) return NextResponse.json({ photos: [] });

  const res = await fetch(
    `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&per_page=80&page=${page}&safesearch=true`,
  );

  if (!res.ok) return NextResponse.json({ photos: [] }, { status: res.status });

  const data = await res.json();
  return NextResponse.json({
    photos: (data.hits ?? []).map((p: {
      id: number;
      largeImageURL: string;
      webformatURL: string;
      tags: string;
      user: string;
      pageURL: string;
    }) => ({
      id: p.id,
      src: p.largeImageURL,
      thumb: p.webformatURL,
      alt: p.tags,
      photographer: p.user,
      pexelsUrl: p.pageURL,
    })),
    totalResults: data.totalHits,
    nextPage: data.totalHits > parseInt(page) * 80 ? String(parseInt(page) + 1) : null,
  });
}
