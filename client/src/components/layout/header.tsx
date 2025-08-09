import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bell, Plus, Search } from "lucide-react";
import type { User } from "@shared/schema";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden text-gray-600 hover:text-gray-900">
            <i className="fas fa-bars"></i>
          </button>
          <h2 className="text-2xl font-semibold text-construction-gray">{title}</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search projects, documents..." 
              className="w-80 pl-10"
            />
          </div>
          
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </Button>
          
          {user && (
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.profileImageUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-construction-orange text-white text-sm">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-construction-gray">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRole(user.role || 'client')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
