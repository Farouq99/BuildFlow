import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing-page';
import { DashboardPage } from '@/components/dashboard-page';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    return <LandingPage />;
  }

  return <DashboardPage user={user} />;
}