import StatsCards from "@/components/dashboard/stats-cards";
import ActiveProjects from "@/components/dashboard/active-projects";
import QuickTools from "@/components/dashboard/quick-tools";
import RecentActivity from "@/components/dashboard/recent-activity";
import BudgetOverview from "@/components/dashboard/budget-overview";

export default function Dashboard() {
  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Quick Stats */}
      <StatsCards />

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <ActiveProjects />

        {/* Quick Tools */}
        <QuickTools />
      </div>

      {/* Recent Activity & Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RecentActivity />
        <BudgetOverview />
      </div>
    </main>
  );
}
