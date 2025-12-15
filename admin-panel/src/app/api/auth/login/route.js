import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Call your real backend API
    // In development: use /auth/login (direct backend on localhost)
    // In production: use /api/auth/login (through nginx proxy)
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Determine base URL and path based on environment
    let baseUrl;
    let authPath;
    
    if (isDevelopment) {
      // Development: always use localhost directly, ignore NEXT_PUBLIC_API_URL
      baseUrl = 'http://localhost:2018';
      authPath = '/auth/login';
    } else {
      // Production: use public URL with /api/ prefix (nginx will proxy to backend)
      baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://waterreportcard.com';
      authPath = '/api/auth/login';
    }
    
    const backendUrl = `${baseUrl}${authPath}`;
    console.log('Attempting login to:', backendUrl, 'NODE_ENV:', process.env.NODE_ENV);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log('Backend response status:', backendResponse.status);
    console.log('Backend response headers:', Object.fromEntries(backendResponse.headers.entries()));

    if (!backendResponse.ok) {
      // Check if response is JSON before parsing
      const contentType = backendResponse.headers.get('content-type');
      let errorMessage = 'Invalid credentials';
      let errorType = 'authentication_failed';
      let isConsumerUser = false;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await backendResponse.json();
          errorMessage = errorData.message || errorMessage;
          
          // Determine error type based on response
          if (backendResponse.status === 401) {
            // Check if this is a consumer user access denial or wrong credentials
            if (errorData.message && errorData.message.toLowerCase().includes('consumer')) {
              errorType = 'access_denied';
              isConsumerUser = true;
            } else {
              errorType = 'authentication_failed';
            }
          }
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          errorMessage = `Server error (${backendResponse.status})`;
        }
      } else {
        // If not JSON, get text content
        try {
          const errorText = await backendResponse.text();
          console.error('Backend returned non-JSON error:', errorText);
          errorMessage = `Server error (${backendResponse.status})`;
        } catch (textError) {
          console.error('Failed to read error response:', textError);
          errorMessage = `Server error (${backendResponse.status})`;
        }
      }
      
      // Return modal trigger for all authentication/authorization failures
      return NextResponse.json(
        { 
          error: errorMessage,
          errorType: errorType,
          isConsumerUser: isConsumerUser,
          showModal: true
        },
        { status: backendResponse.status }
      );
    }

    // Parse successful response
    let data;
    try {
      data = await backendResponse.json();
    } catch (parseError) {
      console.error('Failed to parse successful response as JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid response format from server' },
        { status: 500 }
      );
    }
    
    // Handle the actual backend response format
    if (data.success && data.data) {
      // Check if user has admin access before returning success
      const isPlatformAdmin = data.data.memberships && data.data.memberships.some(m => 
        m.role_key === 'waterreportcard_super_admin'
      );
      
      if (!isPlatformAdmin) {
        // User is authenticated but doesn't have admin access (consumer user)
        return NextResponse.json(
          { 
            error: 'Access denied. Only LiquosLabs Platform Administrators can access this panel.',
            errorType: 'access_denied',
            isConsumerUser: true,
            showModal: true
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json({
        accessToken: data.data.token,
        user: data.data.user,
        memberships: data.data.memberships,
        consumer: data.data.consumer,
        must_change_password: data.data.must_change_password,
        is_new_oauth_connection: data.data.is_new_oauth_connection
      });
    } else {
      return NextResponse.json(
        { 
          error: data.message || 'Login failed',
          errorType: 'login_failed',
          showModal: true
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        errorType: 'server_error',
        showModal: true
      },
      { status: 500 }
    );
  }
} 