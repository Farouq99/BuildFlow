import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  ArrowRight,
  Zap
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface HealthWidgetProps {
  className?: string;
}

export default function HealthWidget({ className }: HealthWidgetProps) {
  // Simplified health check for quick widget display
  const { data: quickHealth, isLoading } = useQuery({
    queryKey: ['/api/dashboard/quick-health'],
    queryFn: async () => {
      const stats = await apiRequest('/api/dashboard/stats');
      const projects = await apiRequest('/api/projects');
      
      // Quick health calculation
      const activeProjects = projects?.filter((p: any) => p.status === 'active').length || 0;
      const totalBudget = projects?.reduce((sum: number, p: any) => sum + parseFloat(p.budget || 0), 0) || 0;
      
      return {
        status: activeProjects > 0 && totalBudget > 0 ? 'good' : 'warning',
        activeProjects,
        budgetHealth: totalBudget > 50000 ? 'healthy' : 'attention',
        lastUpdated: new Date().toISOString()
      };
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-4">
            <Activity className="h-5 w-5 animate-pulse text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Checking health...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isHealthy = quickHealth?.status === 'good';
  const StatusIcon = isHealthy ? CheckCircle : AlertTriangle;
  const statusColor = isHealthy ? 'text-green-600' : 'text-yellow-600';
  const statusBg = isHealthy ? 'bg-green-100' : 'bg-yellow-100';

  return (
    <Card className={`${className} hover:shadow-md transition-shadow cursor-pointer group`}>
      <Link href="/projects">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${statusBg}`}>
                <StatusIcon className={`h-5 w-5 ${statusColor}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Project Health</h3>
                <p className="text-xs text-muted-foreground">
                  {quickHealth?.activeProjects || 0} active projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={isHealthy ? "default" : "secondary"}
                className={isHealthy ? "bg-green-600" : "bg-yellow-600"}
              >
                {isHealthy ? 'Healthy' : 'Attention'}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-construction-orange transition-colors" />
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Budget tracking
              </span>
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Real-time updates
              </span>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
              View Details
            </Button>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}