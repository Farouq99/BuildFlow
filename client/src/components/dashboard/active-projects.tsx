import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import type { Project } from "@shared/schema";

export default function ActiveProjects() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const activeProjects = projects?.filter(p => p.status === 'active').slice(0, 3) || [];

  const getStatusColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-construction-orange";
    return "bg-blue-500";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle>Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-construction-gray">Active Projects</h3>
          <Link href="/projects">
            <Button variant="link" className="text-construction-orange hover:text-orange-600 p-0">
              View All
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="p-6">
        {activeProjects.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-project-diagram text-gray-400 text-xl"></i>
            </div>
            <h4 className="font-medium text-construction-gray mb-2">No active projects</h4>
            <p className="text-sm text-gray-500 mb-4">Create your first project to get started</p>
            <Link href="/projects">
              <Button className="bg-construction-orange hover:bg-orange-600 text-white">
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-4">
                  <img 
                    src={project.imageUrl || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&w=60&h=60&fit=crop"} 
                    alt={project.name} 
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-construction-gray">{project.name}</h4>
                    <p className="text-sm text-gray-500">{project.location || "No location set"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-construction-gray">{project.progress}%</span>
                    <div className="w-20">
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Due: {formatDate(project.endDate)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
