import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');
    
    console.log('[API Route] /api/contacts/dropdown-options POST - Token present:', !!token);

    const baseUrl = 'http://localhost:2018';
    
    const backendResponse = await fetch(`${baseUrl}/contacts/dropdown-options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Failed to get dropdown options' }));
      return NextResponse.json(
        { success: false, ...errorData },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Contacts dropdown-options API proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

