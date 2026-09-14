import { NextResponse } from 'next/server';
import { getHomeFeedData } from '@/lib/innertube';

export async function GET() {
  try {
    const data = await getHomeFeedData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Explore feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch explore data', message: error?.message || String(error) },
      { status: 500 }
    );
  }
}
