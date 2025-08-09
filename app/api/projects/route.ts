import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, user) => {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  // Mock project data - in production this would query the database
  const projects = [
    {
      id: '1',
      name: 'Downtown Office Complex',
      status: 'active',
      budget: 850000,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Residential Tower A',
      status: 'active',
      budget: 1200000,
      startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'Bridge Renovation',
      status: 'planning',
      budget: 450000,
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ].slice(0, limit);

  return NextResponse.json(projects);
});