import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Get the backend API URL
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018'}/auth/users/stats`;
    console.log('Fetching user stats from:', backendUrl);
    
    // Get authorization header from the request
    const authHeader = request.headers.get('authorization');
    
    // Call the backend API
    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader }),
      },
    });

    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type');
      let errorMessage = `Failed to fetch user stats (${backendResponse.status})`;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await backendResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    console.log('Backend response data:', data);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in /api/users/stats route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
