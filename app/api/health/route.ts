import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check - verify environment and return 200
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || '5000',
    };

    return NextResponse.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}