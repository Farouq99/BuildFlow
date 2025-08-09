import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';

export const GET = withAuth(async (request: NextRequest, user) => {
  // Mock stats data - in production this would query the database
  const stats = {
    activeProjects: 12,
    totalDocuments: 248,
    teamMembers: 8,
    totalBudget: 1250000,
  };

  return NextResponse.json(stats);
});