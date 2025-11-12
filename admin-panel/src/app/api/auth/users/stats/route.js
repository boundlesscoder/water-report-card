import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    console.log('API route /api/auth/users/stats called');
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('No authentication token provided');
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }
    
    const base = 'http://localhost:2018';
    const backendUrl = `${base}/auth/users/stats`;
    console.log('Fetching user stats from:', backendUrl);
    
    const resp = await fetch(backendUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Backend response status:', resp.status);
    
    const data = await resp.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    console.error('Error in /api/auth/users/stats route:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}
