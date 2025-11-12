import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Call your real backend API
    // Use the same pattern as the login route
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018'}/api/auth/request-reset`;
    console.log('Attempting password reset to:', backendUrl);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!backendResponse.ok) {
      const contentType = backendResponse.headers.get('content-type');
      let errorMessage = 'Failed to send reset email';
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await backendResponse.json();
          errorMessage = errorData.message || errorMessage;
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
    
    return NextResponse.json({
      success: true,
      message: data.message || 'Password reset email sent successfully'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
