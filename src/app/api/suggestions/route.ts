import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/innertube';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const yt = await getInnertube();
    const suggestions = await yt.getSearchSuggestions(query.trim());
    return NextResponse.json({ suggestions: suggestions || [] });
  } catch (error: unknown) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
