import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  try {
    const { id, membershipId } = params;
    const body = await request.json();
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2018';
    const response = await fetch(`${base}/auth/users/${id}/memberships/${membershipId}`, {
      method: 'PUT',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error updating user membership:', error);
    return NextResponse.json({ error: 'Failed to update user membership' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id, membershipId } = params;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:2018';
    const response = await fetch(`${base}/auth/users/${id}/memberships/${membershipId}`, {
      method: 'DELETE',
      headers: {
        'Cookie': request.headers.get('cookie') || '',
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error removing user membership:', error);
    return NextResponse.json({ error: 'Failed to remove user membership' }, { status: 500 });
  }
}
