import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    
    // Determine the backend URL based on environment
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018';
    
    // Forward the request to the backend
    const response = await fetch(`${baseUrl}/api/auth/accept-invitation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Accept invitation proxy error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
