import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

interface DashboardStats {
  activeProjects: number;
  totalBudget: number;
  teamMembers: number;
  completionRate: number;
}

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  const statsCards = [
    {
      label: "Active Projects",
      value: stats?.activeProjects || 0,
      icon: "fas fa-project-diagram",
      change: "+12%",
      color: "construction-orange"
    },
    {
      label: "Total Budget",
      value: stats ? formatCurrency(stats.totalBudget) : "$0",
      icon: "fas fa-dollar-sign",
      change: "+8%",
      color: "green-500"
    },
    {
      label: "Team Members",
      value: stats?.teamMembers || 0,
      icon: "fas fa-users",
      change: "+3%",
      color: "blue-500"
    },
    {
      label: "Completion Rate",
      value: `${stats?.completionRate || 0}%`,
      icon: "fas fa-chart-line",
      change: "+5%",
      color: "purple-500"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsCards.map((card, index) => (
        <Card key={index} className="border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-3xl font-bold text-construction-gray mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${card.color} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                <i className={`${card.icon} text-${card.color} text-xl`}></i>
              </div>
            </div>
            <div className="flex items-center mt-4">
              <span className="text-green-500 text-sm font-medium">{card.change}</span>
              <span className="text-gray-500 text-sm ml-2">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
