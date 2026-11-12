import { NextRequest, NextResponse } from 'next/server';
import { getUsers, registerOrGetUser, getUserByUsername } from '@/lib/db';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  if (username) {
    const user = getUserByUsername(username);
    if (user) {
      return NextResponse.json({ user });
    }
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const users = getUsers();
  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, name } = body;

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = registerOrGetUser(username, name);
    return NextResponse.json({ user });
  } catch (error: unknown) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate user', message: (error as Error)?.message || String(error) },
      { status: 500 }
    );
  }
}
