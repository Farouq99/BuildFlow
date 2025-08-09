'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Plus, 
  FileText, 
  Users, 
  DollarSign,
  Activity,
  Settings,
  LogOut,
  Bell,
  Search,
  Filter
} from 'lucide-react';
import { ProjectList } from './project-list';
import { RecentActivity } from './recent-activity';
import { FileUploadZone } from './file-upload-zone';
import { ExpenseOverview } from './expense-overview';
import { PayrollSummary } from './payroll-summary';
import type { User } from '@/lib/schema';

interface DashboardPageProps {
  user: User;
}

export function DashboardPage({ user }: DashboardPageProps) {
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch dashboard data
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/dashboard/stats').then(res => res.json()),
  });

  const { data: recentProjects } = useQuery({
    queryKey: ['recent-projects'],
    queryFn: () => fetch('/api/projects?limit=5').then(res => res.json()),
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <Building2 className="h-8 w-8 text-construction-orange" />
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  ConstructPro
                </h1>
                <Badge variant="secondary">Enterprise</Badge>
              </div>
              
              <nav className="hidden lg:flex items-center space-x-6">
                <Button 
                  variant={selectedTab === 'overview' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('overview')}
                >
                  Overview
                </Button>
                <Button 
                  variant={selectedTab === 'projects' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('projects')}
                >
                  Projects
                </Button>
                <Button 
                  variant={selectedTab === 'documents' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('documents')}
                >
                  Documents
                </Button>
                <Button 
                  variant={selectedTab === 'expenses' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('expenses')}
                >
                  Expenses
                </Button>
                <Button 
                  variant={selectedTab === 'team' ? 'default' : 'ghost'}
                  onClick={() => setSelectedTab('team')}
                >
                  Team
                </Button>
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user.profileImageUrl || ''} />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {user.role}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Welcome back, {user.firstName}!
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Here's what's happening with your construction projects.
                </p>
              </div>
              <Button className="construction-gradient text-white">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeProjects || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalDocuments || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +12 this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.teamMembers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +3 new this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${stats?.totalBudget?.toLocaleString() || '0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    85% allocated
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Projects */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>
                    Your most recent construction projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProjectList projects={recentProjects} />
                </CardContent>
              </Card>

              {/* Quick Upload */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Upload</CardTitle>
                  <CardDescription>
                    Upload CAD files, documents, or images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUploadZone compact />
                </CardContent>
              </Card>
            </div>

            {/* Activity and Expenses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest updates across your projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentActivity />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Overview</CardTitle>
                  <CardDescription>
                    This month's spending summary
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpenseOverview />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Other tabs would be implemented here */}
          <TabsContent value="projects">
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Projects View</h3>
              <p className="text-muted-foreground">Full project management interface coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Document Management</h3>
              <p className="text-muted-foreground">Advanced document management with CAD previews coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Expense Management</h3>
              <p className="text-muted-foreground">Comprehensive expense and payroll management coming soon...</p>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Team Management</h3>
              <p className="text-muted-foreground">Role-based team management interface coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}