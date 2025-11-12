import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }
    
    // Use localhost for development, production URL for production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const base = isDevelopment ? 'http://localhost:2018' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018');
    const resp = await fetch(`${base}/auth/profile`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    console.error('Error in /api/auth/profile GET route:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }
    
    // Use localhost for development, production URL for production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const base = isDevelopment ? 'http://localhost:2018' : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018');
    const resp = await fetch(`${base}/auth/profile`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    console.error('Error in /api/auth/profile PUT route:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
