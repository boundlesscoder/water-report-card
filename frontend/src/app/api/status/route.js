import { NextResponse } from 'next/server';
import { BACKEND_URL } from '@/lib/api-config';

export async function GET() {
    try {
       
        // Test health endpoint
        const healthResponse = await fetch(`${BACKEND_URL}/health/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(3000)
        });

        if (!healthResponse.ok) {
            return NextResponse.json({
                success: false,
                message: `Backend health check failed: ${healthResponse.status}`,
                backend_url: BACKEND_URL
            });
        }

        const healthData = await healthResponse.json();

        // Test layer styles endpoint
        const stylesResponse = await fetch(`${BACKEND_URL}/layer-styles/styles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(3000)
        });

        const stylesData = stylesResponse.ok ? await stylesResponse.json() : null;

        return NextResponse.json({
            success: true,
            backend_url: BACKEND_URL,
            health: healthData,
            layer_styles: stylesData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Status check failed:', error);
        
        return NextResponse.json({
            success: false,
            message: error.message,
            backend_url: BACKEND_URL,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
} 