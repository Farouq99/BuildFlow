import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { User } from "@shared/schema";

export default function Team() {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  // Mock team data for demonstration
  const teamMembers = [
    {
      id: "1",
      firstName: "John",
      lastName: "Smith",
      email: "john.smith@company.com",
      role: "project_manager",
      profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      projects: ["Downtown Office Complex", "City Bridge Renovation"]
    },
    {
      id: "2",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.johnson@company.com",
      role: "engineer",
      profileImageUrl: "https://images.unsplash.com/photo-1494790108755-2616b9fd9fd9?w=100&h=100&fit=crop&crop=face",
      projects: ["Downtown Office Complex", "Riverside Housing"]
    },
    {
      id: "3",
      firstName: "Mike",
      lastName: "Chen",
      email: "mike.chen@contractor.com",
      role: "subcontractor",
      profileImageUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      projects: ["Riverside Housing"]
    },
  ];

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800";
      case "project_manager": return "bg-blue-100 text-blue-800";
      case "engineer": return "bg-green-100 text-green-800";
      case "subcontractor": return "bg-purple-100 text-purple-800";
      case "client": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-construction-gray mb-2">Team Management</h2>
        <p className="text-gray-600">Manage your construction team members and their roles</p>
      </div>

      {/* Current User Card */}
      {user && (
        <Card className="mb-6 bg-construction-orange bg-opacity-10 border-construction-orange">
          <CardHeader>
            <CardTitle className="text-construction-orange">Your Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.profileImageUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-construction-orange text-white text-lg">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-construction-gray">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-600">{user.email}</p>
                <Badge className={getRoleColor(user.role || 'client')}>
                  {formatRole(user.role || 'client')}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.profileImageUrl} alt={`${member.firstName} ${member.lastName}`} />
                    <AvatarFallback>
                      {member.firstName[0]}{member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-construction-gray">
                      {member.firstName} {member.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{member.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(member.role)}>
                        {formatRole(member.role)}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {member.projects.length} project{member.projects.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    Active Projects:
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.projects.join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {teamMembers.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-gray-400 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-500">Invite team members to collaborate on projects</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
