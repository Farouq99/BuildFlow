import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, DollarSign } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  budget: number;
  startDate: string;
  endDate?: string;
}

interface ProjectListProps {
  projects?: Project[];
}

export function ProjectList({ projects = [] }: ProjectListProps) {
  if (!projects.length) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No projects yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
          <div className="space-y-1">
            <h4 className="font-medium">{project.name}</h4>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(project.startDate).toLocaleDateString()}</span>
              </div>
              {project.budget && (
                <div className="flex items-center space-x-1">
                  <DollarSign className="h-3 w-3" />
                  <span>${project.budget.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}