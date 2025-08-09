import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LandingPage } from '@/components/landing-page';
import { DashboardPage } from '@/components/dashboard-page';

export default async function HomePage() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return <LandingPage />;
    }

    return <DashboardPage user={user} />;
  } catch (error) {
    console.error('Error loading home page:', error);
    // Return a fallback component instead of throwing
    return <LandingPage />;
  }
}