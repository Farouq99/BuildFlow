import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, UserPlus, DollarSign, Activity } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
  };
  createdAt: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

const activityIcons = {
  document_uploaded: FileText,
  member_added: UserPlus,
  expense_created: DollarSign,
  project_updated: Activity,
} as const;

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  // Mock data for demo
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'document_uploaded',
      description: 'uploaded floor plans for Building A',
      user: { name: 'John Smith', avatar: '' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    },
    {
      id: '2',
      type: 'member_added',
      description: 'added Sarah Wilson to the project team',
      user: { name: 'Mike Johnson', avatar: '' },
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    },
    {
      id: '3',
      type: 'expense_created',
      description: 'submitted material expense for $2,500',
      user: { name: 'Alex Chen', avatar: '' },
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    },
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  return (
    <div className="space-y-4">
      {displayActivities.map((activity) => {
        const IconComponent = activityIcons[activity.type as keyof typeof activityIcons] || Activity;
        const initials = activity.user.name.split(' ').map(n => n[0]).join('');
        
        return (
          <div key={activity.id} className="flex items-start space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.avatar} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <IconComponent className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{activity.user.name}</strong> {activity.description}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {getTimeAgo(activity.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}