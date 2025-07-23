import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'This is a placeholder API route',
    timestamp: new Date().toISOString()
  });
}

export async function POST(_request: NextRequest) {
  return NextResponse.json({
    message: 'POST method placeholder',
    timestamp: new Date().toISOString()
  });
} 