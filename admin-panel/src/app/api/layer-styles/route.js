import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018';

export async function GET() {
    try {
        const response = await fetch(`${BACKEND_URL}/layer-styles/styles`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();
        
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching layer styles:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Error occurred while fetching layer styles.' 
            },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        const response = await fetch(`${BACKEND_URL}/layer-styles/styles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('authorization') || '',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error creating layer style:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Error occurred while creating layer style.' 
            },
            { status: 500 }
        );
    }
} 