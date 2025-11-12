import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const qs = url.search;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    const base = 'http://localhost:2018';
    const resp = await fetch(`${base}/auth/users${qs}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    console.log('API route /api/auth/users PATCH called');
    
    const body = await request.json();
    const { userId, action } = body;
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }
    
    console.log('Setting user inactive with ID:', userId);
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('No authentication token provided');
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }
    
    const base = 'http://localhost:2018';
    const backendUrl = `${base}/auth/users/${userId}/inactive`;
    console.log('Setting user inactive from:', backendUrl);
    
    const resp = await fetch(backendUrl, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Backend response status:', resp.status);
    
    if (!resp.ok) {
      const contentType = resp.headers.get('content-type');
      let errorMessage = `Failed to deactivate user (${resp.status})`;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await resp.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
        }
      } else {
        try {
          const errorText = await resp.text();
          console.error('Backend returned non-JSON error:', errorText);
        } catch (textError) {
          console.error('Failed to read error response:', textError);
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: resp.status }
      );
    }
    
    const data = await resp.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    console.error('Error in /api/auth/users PATCH route:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    console.log('API route /api/auth/users DELETE called');
    
    // Extract user ID from the request body or headers
    const body = await request.json();
    const userId = body.userId;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    console.log('Deleting user with ID:', userId);
    
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      console.log('No authentication token provided');
      return NextResponse.json({ error: 'No authentication token provided' }, { status: 401 });
    }
    
    const base = 'http://localhost:2018';
    const backendUrl = `${base}/auth/users/${userId}`;
    console.log('Deleting user from:', backendUrl);
    
    const resp = await fetch(backendUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Backend response status:', resp.status);
    
    if (!resp.ok) {
      const contentType = resp.headers.get('content-type');
      let errorMessage = `Failed to delete user (${resp.status})`;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await resp.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
        }
      } else {
        try {
          const errorText = await resp.text();
          console.error('Backend returned non-JSON error:', errorText);
        } catch (textError) {
          console.error('Failed to read error response:', textError);
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: resp.status }
      );
    }
    
    const data = await resp.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data, { status: resp.status });
  } catch (e) {
    console.error('Error in /api/auth/users DELETE route:', e);
    return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
  }
}



