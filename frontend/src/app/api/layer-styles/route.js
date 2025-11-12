import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api-config';

export async function GET() {
    try {
        // In production, the backend might be on a different port or subdomain
        const backendEndpoint = process.env.NODE_ENV === 'production' 
            ? `${BACKEND_URL}/layer-styles/styles`
            : `${BACKEND_URL}/layer-styles/styles`;
            
        const response = await fetch(backendEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(5000)
        });

        if (!response.ok) {
            console.error('Backend responded with status:', response.status);
            return NextResponse.json(
                { 
                    success: false, 
                    message: `Backend server error: ${response.status}` 
                },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching layer styles:', error);
        
        // Check if it's a timeout or connection error
        if (error.name === 'AbortError') {
            return NextResponse.json(
                { 
                    success: false, 
                    message: 'Backend server timeout - please check if the server is running' 
                },
                { status: 503 }
            );
        }
        
        return NextResponse.json(
            { 
                success: false, 
                message: 'Error occurred while fetching layer styles.' 
            },
            { status: 500 }
        );
    }
} 