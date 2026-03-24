import { Outlet, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldCheck, FileSearch,
  ScrollText, BadgeCheck, LogOut, ChevronLeft, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Verifications", url: "/admin/verifications", icon: ShieldCheck },
  { title: "Tenants", url: "/admin/tenants", icon: Users },
  { title: "EARB Tracker", url: "/admin/earb", icon: BadgeCheck },
  { title: "Audit Log", url: "/admin/audit", icon: ScrollText },
];

export function AdminLayout() {
  const location = useLocation();

  const isActive = (url: string, exact = false) =>
    exact ? location.pathname === url : location.pathname.startsWith(url);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r flex flex-col bg-sidebar">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-sm">D</div>
            <div>
              <span className="font-heading font-semibold text-sm">Dwelly</span>
              <p className="text-[10px] text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              end={item.exact}
              className={({ isActive: a }) =>
                cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(item.url, item.exact)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.title}
            </NavLink>
          ))}
        </nav>

        <div className="p-2 border-t space-y-0.5">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <ChevronLeft className="h-4 w-4" />Dashboard
          </NavLink>
          <NavLink to="/login" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-4 w-4" />Sign Out
          </NavLink>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <p className="text-sm font-medium text-muted-foreground">Admin Portal</p>
          <div className="flex items-center gap-3">
            <button className="relative h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">AD</div>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
