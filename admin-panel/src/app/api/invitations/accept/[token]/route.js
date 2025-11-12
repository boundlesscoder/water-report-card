import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    const { token } = params;
    console.log(`API route /api/invitations/accept/${token} called`);
    
    // Get the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    // Get the backend API URL
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018'}/invitations/accept/${token}`;
    console.log('Accepting invitation at:', backendUrl);
    
    // Call the backend API (no auth required for invitation acceptance)
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('Backend response status:', backendResponse.status);

    if (!backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type');
      let errorMessage = `Failed to accept invitation (${backendResponse.status})`;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await backendResponse.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
        }
      } else {
        try {
          const errorText = await backendResponse.text();
          console.error('Backend returned non-JSON error:', errorText);
        } catch (textError) {
          console.error('Failed to read error response:', textError);
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
    console.error(`Error in /api/invitations/accept/${params.token} route:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
