import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:2018';

export async function PUT(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        
        const response = await fetch(`${BACKEND_URL}/layer-styles/styles/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': request.headers.get('authorization') || '',
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();
        
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error updating layer style:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Error occurred while updating layer style.' 
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request, { params }) {
    try {
        const { id } = params;
        
        const response = await fetch(`${BACKEND_URL}/layer-styles/styles/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': request.headers.get('authorization') || '',
            },
        });

        const data = await response.json();
        
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error('Error deleting layer style:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Error occurred while deleting layer style.' 
            },
            { status: 500 }
        );
    }
} 