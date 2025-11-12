import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { roleId } = params;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2018';
    const response = await fetch(`${base}/auth/roles/${roleId}/capabilities`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching role capabilities:', error);
    return NextResponse.json({ error: 'Failed to fetch role capabilities' }, { status: 500 });
  }
}
