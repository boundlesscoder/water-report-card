import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2018';
    const response = await fetch(`${base}/auth/users/${id}/memberships`, {
      method: 'GET',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error fetching user memberships:', error);
    return NextResponse.json({ error: 'Failed to fetch user memberships' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2018';
    const response = await fetch(`${base}/auth/users/${id}/memberships`, {
      method: 'POST',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error adding user membership:', error);
    return NextResponse.json({ error: 'Failed to add user membership' }, { status: 500 });
  }
}
