import React, { useState } from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, Users, DollarSign, Clock, MessageSquare, Activity } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import ProjectTimeline from '@/components/timeline/project-timeline';
import ProjectChat from '@/components/chat/project-chat';
import ProjectHealthDashboard from '@/components/dashboard/project-health-dashboard';

export default function ProjectDetails() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('health');

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ['/api/projects', id],
    queryFn: () => apiRequest(`/api/projects/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex-1 p-4 sm:p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Project not found</h2>
          <p className="text-gray-600 mt-2">The project you're looking for doesn't exist.</p>
          <Button className="mt-4" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const daysPassed = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 3600 * 24));
  const progressPercentage = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="self-start"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold">{project.name}</h1>
            <Badge 
              variant={project.status === 'active' ? 'default' : 'secondary'}
              className="self-start sm:self-auto"
            >
              {project.status}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">{project.description}</p>
        </div>
      </div>

      {/* Quick Stats Cards - Mobile Responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Budget</p>
                <p className="text-lg font-semibold">${parseFloat(project.budget).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-lg font-semibold">{totalDays} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Progress</p>
                <p className="text-lg font-semibold">{Math.round(progressPercentage)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Team</p>
                <p className="text-lg font-semibold">5 members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Project Timeline</CardTitle>
          <CardDescription>
            {format(startDate, 'MMM dd, yyyy')} - {format(endDate, 'MMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Started {format(startDate, 'MMM dd')}</span>
              <span>Due {format(endDate, 'MMM dd')}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Health</span>
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <ProjectHealthDashboard projectId={project.id} />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="mt-1">{project.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className="mt-1 capitalize">{project.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Priority</label>
                    <p className="mt-1 capitalize">{project.priority || 'Medium'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Location</label>
                  <p className="mt-1">{project.location || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Project Manager</p>
                      <p className="text-sm text-gray-600">john@example.com</p>
                    </div>
                    <Badge variant="outline">Manager</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Lead Engineer</p>
                      <p className="text-sm text-gray-600">sarah@example.com</p>
                    </div>
                    <Badge variant="outline">Engineer</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Site Supervisor</p>
                      <p className="text-sm text-gray-600">mike@example.com</p>
                    </div>
                    <Badge variant="outline">Supervisor</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Foundation work completed</p>
                    <p className="text-sm text-gray-600">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Electrical permits approved</p>
                    <p className="text-sm text-gray-600">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Material delivery scheduled</p>
                    <p className="text-sm text-gray-600">2 days ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <ProjectTimeline projectId={project.id} />
        </TabsContent>

        <TabsContent value="chat">
          <ProjectChat 
            projectId={project.id} 
            currentUserId="user-1" // This should come from auth context
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}