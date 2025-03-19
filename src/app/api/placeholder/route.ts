import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ message: 'This is a placeholder API route' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function POST(request: NextRequest) {
  return new Response(JSON.stringify({ message: 'This is a placeholder API route' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
} 