import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", icon: "fas fa-tachometer-alt", label: "Dashboard" },
  { href: "/projects", icon: "fas fa-project-diagram", label: "Projects" },
  { href: "/calculators", icon: "fas fa-calculator", label: "Calculators" },
  { href: "/documents", icon: "fas fa-file-alt", label: "Documents" },
  { href: "/team", icon: "fas fa-users", label: "Team" },
  { href: "/expenses", icon: "fas fa-receipt", label: "Expenses" },
  { href: "/payroll", icon: "fas fa-money-check-alt", label: "Payroll" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-construction-gray text-white">
      <div className="flex items-center justify-center h-16 bg-steel-blue">
        <h1 className="text-xl font-bold">ConstructPro</h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigationItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a className={cn(
              "flex items-center px-4 py-3 rounded-lg transition-colors",
              location === item.href 
                ? "bg-construction-orange text-white" 
                : "hover:bg-light-gray"
            )}>
              <i className={`${item.icon} mr-3`}></i>
              <span>{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-light-gray">
        <button
          onClick={() => window.location.href = '/api/logout'}
          className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-light-gray transition-colors text-left"
        >
          <i className="fas fa-sign-out-alt mr-3"></i>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
