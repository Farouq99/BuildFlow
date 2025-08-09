import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, DollarSign, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Project } from "@shared/schema";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'planning':
        return 'Planning';
      case 'on_hold':
        return 'On Hold';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-construction-orange";
    return "bg-blue-500";
  };

  const formatCurrency = (amount: string | null) => {
    if (!amount) return "$0";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const progressPercentage = project.progress || 0;
  const budgetUsed = project.spent ? (parseFloat(project.spent) / parseFloat(project.budget || '1')) * 100 : 0;

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-construction-gray text-lg leading-tight">
                {project.name}
              </h3>
              <Badge className={getStatusColor(project.status || 'planning')}>
                {getStatusLabel(project.status || 'planning')}
              </Badge>
            </div>
            
            {project.location && (
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <MapPin className="h-4 w-4 mr-1" />
                {project.location}
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Project</DropdownMenuItem>
              <DropdownMenuItem>View Documents</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete Project</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Project Image */}
        <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100">
          <img 
            src={project.imageUrl || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&w=400&h=225&fit=crop"} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-construction-gray">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Budget */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <DollarSign className="h-4 w-4 mr-1" />
            <span>Budget</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-construction-gray">
              {formatCurrency(project.budget)}
            </div>
            <div className="text-xs text-gray-500">
              {formatCurrency(project.spent)} spent
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Timeline</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-construction-gray">
              {formatDate(project.endDate)}
            </div>
            <div className="text-xs text-gray-500">
              Started {formatDate(project.startDate)}
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {project.description}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 border-construction-orange text-construction-orange hover:bg-orange-50"
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-construction-orange hover:bg-orange-600 text-white"
          >
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
