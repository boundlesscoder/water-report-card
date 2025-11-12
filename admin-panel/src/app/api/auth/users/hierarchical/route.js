import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2018';
    const response = await fetch(`${base}/auth/users-hierarchical`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching hierarchical users:', error);
    return NextResponse.json({ error: 'Failed to fetch hierarchical users' }, { status: 500 });
  }
}
