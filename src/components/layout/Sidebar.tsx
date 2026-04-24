import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  BarChart2,
  Search,
  BookOpen,
  FileText,
  Database,
  Activity,
  CalendarDays,
  Gauge,
  Home,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Introduction", end: true },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/recommendations", icon: Sparkles, label: "Recommendations" },
  { to: "/stock-analysis", icon: TrendingUp, label: "Stock Analysis" },
  { to: "/sectors", icon: BarChart2, label: "Sectors" },
  { to: "/screener", icon: Search, label: "Screener" },
  { to: "/market-depth", icon: BookOpen, label: "Market Depth" },
  { to: "/floorsheet", icon: FileText, label: "Floorsheet" },
  { to: "/data-manager", icon: Database, label: "Data Manager" },
  { to: "/calendar", icon: CalendarDays, label: "Calendar" },
  { to: "/quant", icon: Gauge, label: "Quant Lab" },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-card border-r border-border flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">NEPSE Bot</p>
          <p className="text-xs text-muted-foreground">Trading Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end ?? to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border">
        <p className="text-xs text-muted-foreground">Backend: localhost:8000</p>
      </div>
    </aside>
  );
}
