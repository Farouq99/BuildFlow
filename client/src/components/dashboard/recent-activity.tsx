import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@shared/schema";

interface Activity {
  id: string;
  projectId: string;
  userId: string;
  type: string;
  description: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function RecentActivity() {
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Mock recent activity - in production this would come from an API
  const recentActivity = [
    {
      id: "1",
      description: "Sarah Johnson uploaded new blueprints for Downtown Office Complex",
      timestamp: "2 hours ago",
      type: "document_uploaded",
      color: "construction-orange"
    },
    {
      id: "2", 
      description: "Mike Chen marked Phase 2 as complete for Riverside Housing",
      timestamp: "4 hours ago",
      type: "progress_updated",
      color: "green-500"
    },
    {
      id: "3",
      description: "David Wilson submitted RFI for electrical specifications",
      timestamp: "6 hours ago",
      type: "rfi_submitted",
      color: "blue-500"
    },
    {
      id: "4",
      description: "Lisa Rodriguez updated budget allocation for materials",
      timestamp: "1 day ago",
      type: "budget_updated",
      color: "yellow-500"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      
      <CardContent>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-clock text-gray-400 text-xl"></i>
            </div>
            <h4 className="font-medium text-construction-gray mb-2">No recent activity</h4>
            <p className="text-sm text-gray-500">Activity will appear here as your team works on projects</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                <div className={`w-2 h-2 bg-${activity.color} rounded-full mt-2 flex-shrink-0`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-construction-gray">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
