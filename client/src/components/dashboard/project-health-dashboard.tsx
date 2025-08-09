import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  Calendar,
  Target,
  Zap,
  RefreshCw
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, differenceInDays, parseISO } from 'date-fns';

interface HealthMetrics {
  overall: 'excellent' | 'good' | 'warning' | 'critical';
  budget: {
    status: 'on-track' | 'over-budget' | 'under-budget';
    spent: number;
    total: number;
    variance: number;
  };
  timeline: {
    status: 'on-track' | 'delayed' | 'ahead';
    completion: number;
    daysRemaining: number;
    milestonesOnTrack: number;
    totalMilestones: number;
  };
  team: {
    productivity: number;
    availability: number;
    workload: 'balanced' | 'overloaded' | 'underutilized';
  };
  quality: {
    score: number;
    issues: number;
    resolved: number;
  };
  risks: Array<{
    type: 'budget' | 'timeline' | 'quality' | 'resource';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
}

interface ProjectHealthProps {
  projectId?: string;
  compact?: boolean;
}

const healthColors = {
  excellent: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  good: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
};

const statusIcons = {
  excellent: CheckCircle,
  good: TrendingUp,
  warning: AlertTriangle,
  critical: AlertTriangle,
};

export default function ProjectHealthDashboard({ projectId, compact = false }: ProjectHealthProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch project health data
  const { data: healthData, isLoading, refetch } = useQuery({
    queryKey: ['/api/projects/health', projectId],
    queryFn: async () => {
      const projects = await apiRequest('/api/projects');
      const expenses = await apiRequest('/api/expenses');
      const stats = await apiRequest('/api/dashboard/stats');

      // Calculate health metrics from available data
      const projectData = projectId ? projects.find((p: any) => p.id === projectId) : null;
      const allProjects = projects || [];
      
      return calculateHealthMetrics(allProjects, expenses, stats, projectData);
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analyzing project health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const health = healthData as HealthMetrics;
  const healthColor = healthColors[health?.overall || 'good'];
  const StatusIcon = statusIcons[health?.overall || 'good'];

  if (compact) {
    return (
      <Card className={`${healthColor.border} border-2`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${healthColor.bg}`}>
                <StatusIcon className={`h-5 w-5 ${healthColor.text}`} />
              </div>
              <div>
                <h3 className="font-semibold">Project Health</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {health?.overall || 'Good'} condition
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {health?.timeline.completion || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {health?.budget.variance || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Budget Var</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Health */}
      <Card className={`${healthColor.border} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${healthColor.bg}`}>
                <StatusIcon className={`h-8 w-8 ${healthColor.text}`} />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {projectId ? 'Project Health Score' : 'Portfolio Health Overview'}
                </CardTitle>
                <CardDescription>
                  <span className={`font-semibold capitalize ${healthColor.text}`}>
                    {health?.overall || 'Good'}
                  </span> - Last updated {format(new Date(), 'MMM dd, HH:mm')}
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Budget Health */}
        <HealthMetricCard
          title="Budget Status"
          value={`${health?.budget.variance || 0}%`}
          subtitle={`$${(health?.budget.spent || 0).toLocaleString()} of $${(health?.budget.total || 0).toLocaleString()}`}
          status={health?.budget.status || 'on-track'}
          icon={DollarSign}
          trend={health?.budget.variance || 0}
        />

        {/* Timeline Health */}
        <HealthMetricCard
          title="Timeline Progress"
          value={`${health?.timeline.completion || 0}%`}
          subtitle={`${health?.timeline.daysRemaining || 0} days remaining`}
          status={health?.timeline.status || 'on-track'}
          icon={Calendar}
          trend={health?.timeline.completion || 0}
        />

        {/* Team Performance */}
        <HealthMetricCard
          title="Team Productivity"
          value={`${health?.team.productivity || 0}%`}
          subtitle={`${health?.team.availability || 0}% availability`}
          status={health?.team.workload === 'balanced' ? 'on-track' : 'warning'}
          icon={Users}
          trend={health?.team.productivity || 0}
        />

        {/* Quality Score */}
        <HealthMetricCard
          title="Quality Score"
          value={`${health?.quality.score || 0}%`}
          subtitle={`${health?.quality.resolved || 0} issues resolved`}
          status={health?.quality.score > 80 ? 'on-track' : 'warning'}
          icon={Target}
          trend={health?.quality.score || 0}
        />
      </div>

      {/* Detailed Health Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestone Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Milestone Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Completion</span>
              <span className="text-sm text-muted-foreground">
                {health?.timeline.milestonesOnTrack || 0} of {health?.timeline.totalMilestones || 0} on track
              </span>
            </div>
            <Progress value={health?.timeline.completion || 0} className="h-2" />
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-green-600">
                  {Math.round((health?.timeline.milestonesOnTrack || 0) / (health?.timeline.totalMilestones || 1) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">On Track</div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">
                  {Math.round(((health?.timeline.totalMilestones || 0) - (health?.timeline.milestonesOnTrack || 0)) / (health?.timeline.totalMilestones || 1) * 100)}%
                </div>
                <div className="text-xs text-muted-foreground">At Risk</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {health?.timeline.daysRemaining || 0}
                </div>
                <div className="text-xs text-muted-foreground">Days Left</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health?.risks?.length ? (
                health.risks.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      risk.severity === 'critical' ? 'bg-red-500' :
                      risk.severity === 'high' ? 'bg-orange-500' :
                      risk.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">{risk.type} Risk</span>
                        <Badge 
                          variant={risk.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {risk.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>No significant risks identified</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface HealthMetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  status: string;
  icon: React.ComponentType<any>;
  trend: number;
}

function HealthMetricCard({ title, value, subtitle, status, icon: Icon, trend }: HealthMetricCardProps) {
  const isPositive = trend >= 0;
  const statusColor = status === 'on-track' ? 'text-green-600' : 
                     status === 'warning' ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${
              status === 'on-track' ? 'bg-green-100' : 
              status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <Icon className={`h-4 w-4 ${statusColor}`} />
            </div>
            <div>
              <h3 className="font-medium text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-xl font-bold ${statusColor}`}>
              {value}
            </div>
            <div className="flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {Math.abs(trend)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate health metrics from available data
function calculateHealthMetrics(projects: any[], expenses: any[], stats: any, project?: any): HealthMetrics {
  const targetProjects = project ? [project] : projects;
  
  // Budget calculations
  const totalBudget = targetProjects.reduce((sum, p) => sum + parseFloat(p.budget || 0), 0);
  const totalSpent = expenses?.reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0) || 0;
  const budgetVariance = totalBudget > 0 ? ((totalSpent - totalBudget) / totalBudget) * 100 : 0;
  
  // Timeline calculations
  const now = new Date();
  let totalCompletion = 0;
  let totalDaysRemaining = 0;
  let milestonesOnTrack = 0;
  let totalMilestones = targetProjects.length * 5; // Assume 5 milestones per project
  
  targetProjects.forEach(p => {
    const endDate = parseISO(p.endDate);
    const startDate = parseISO(p.startDate);
    const totalDays = differenceInDays(endDate, startDate);
    const daysPassed = differenceInDays(now, startDate);
    const completion = Math.min(Math.max((daysPassed / totalDays) * 100, 0), 100);
    
    totalCompletion += completion;
    totalDaysRemaining += Math.max(differenceInDays(endDate, now), 0);
    
    if (completion >= 80 || differenceInDays(endDate, now) > 0) {
      milestonesOnTrack += 4; // Assume 4 out of 5 milestones are on track for healthy projects
    } else {
      milestonesOnTrack += 2; // Assume 2 out of 5 for at-risk projects
    }
  });
  
  const avgCompletion = targetProjects.length > 0 ? totalCompletion / targetProjects.length : 0;
  const avgDaysRemaining = targetProjects.length > 0 ? Math.round(totalDaysRemaining / targetProjects.length) : 0;
  
  // Team metrics (simulated based on project health)
  const teamProductivity = Math.min(Math.max(avgCompletion + (budgetVariance > 0 ? -10 : 10), 60), 95);
  const teamAvailability = Math.min(Math.max(90 - Math.abs(budgetVariance) * 0.5, 70), 95);
  
  // Quality score (simulated)
  const qualityScore = Math.min(Math.max(85 - Math.abs(budgetVariance) * 0.3 - (avgCompletion < 50 ? 10 : 0), 65), 95);
  
  // Risk assessment
  const risks = [];
  if (budgetVariance > 15) {
    risks.push({
      type: 'budget' as const,
      severity: budgetVariance > 30 ? 'critical' as const : 'high' as const,
      description: `Project is ${budgetVariance.toFixed(1)}% over budget`
    });
  }
  
  if (avgCompletion < 30 && avgDaysRemaining < 30) {
    risks.push({
      type: 'timeline' as const,
      severity: 'high' as const,
      description: 'Project timeline is at risk with low completion rate'
    });
  }
  
  if (teamProductivity < 70) {
    risks.push({
      type: 'resource' as const,
      severity: 'medium' as const,
      description: 'Team productivity is below optimal levels'
    });
  }
  
  // Overall health determination
  let overall: HealthMetrics['overall'] = 'good';
  if (risks.some(r => r.severity === 'critical')) {
    overall = 'critical';
  } else if (risks.some(r => r.severity === 'high') || budgetVariance > 20 || avgCompletion < 40) {
    overall = 'warning';
  } else if (budgetVariance < 5 && avgCompletion > 80 && teamProductivity > 85) {
    overall = 'excellent';
  }
  
  return {
    overall,
    budget: {
      status: budgetVariance > 10 ? 'over-budget' : budgetVariance < -5 ? 'under-budget' : 'on-track',
      spent: totalSpent,
      total: totalBudget,
      variance: Math.round(budgetVariance)
    },
    timeline: {
      status: avgCompletion > 80 ? 'ahead' : avgCompletion < 50 && avgDaysRemaining < 30 ? 'delayed' : 'on-track',
      completion: Math.round(avgCompletion),
      daysRemaining: avgDaysRemaining,
      milestonesOnTrack,
      totalMilestones
    },
    team: {
      productivity: Math.round(teamProductivity),
      availability: Math.round(teamAvailability),
      workload: teamProductivity > 85 ? 'balanced' : teamProductivity < 60 ? 'underutilized' : 'overloaded'
    },
    quality: {
      score: Math.round(qualityScore),
      issues: Math.max(Math.round((100 - qualityScore) / 10), 0),
      resolved: Math.round(qualityScore / 10)
    },
    risks
  };
}