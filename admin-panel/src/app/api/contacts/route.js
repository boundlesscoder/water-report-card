import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const token = request.headers.get('authorization');
    
    console.log('[API Route] /api/contacts GET - Token present:', !!token);
    console.log('[API Route] /api/contacts GET - Token value:', token ? token.substring(0, 20) + '...' : 'none');

    const baseUrl = 'http://localhost:2018';
    
    const backendResponse = await fetch(`${baseUrl}/contacts?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Failed to fetch contacts' }));
      return NextResponse.json(
        { success: false, ...errorData },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Contacts API proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization');

    const baseUrl = 'http://localhost:2018';
    
    const backendResponse = await fetch(`${baseUrl}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': token }),
      },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Failed to create contact' }));
      return NextResponse.json(
        { success: false, ...errorData },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Contacts API proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

