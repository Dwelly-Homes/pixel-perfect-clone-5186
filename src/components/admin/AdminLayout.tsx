import { useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, ShieldCheck, ScrollText,
  BadgeCheck, LogOut, ChevronLeft, Bell, Building2,
  UserSquare2, Home, CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { MobileNavItem } from "@/components/MobileBottomNav";

const navGroups = [
  {
    label: "Platform",
    items: [
      { title: "Overview", url: "/admin", icon: LayoutDashboard, exact: true },
      { title: "Properties", url: "/admin/properties", icon: Home },
    ],
  },
  {
    label: "Users",
    items: [
      { title: "Agents & Agencies", url: "/admin/agents", icon: Building2 },
      { title: "Landlords", url: "/admin/landlords", icon: UserSquare2 },
      { title: "Tenants", url: "/admin/tenants", icon: Users },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Verifications", url: "/admin/verifications", icon: ShieldCheck },
      { title: "Billing", url: "/admin/billing", icon: CreditCard },
      { title: "EARB Tracker", url: "/admin/earb", icon: BadgeCheck },
      { title: "Audit Log", url: "/admin/audit", icon: ScrollText },
    ],
  },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "platform_admin")) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch {
      // ignore
    }
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const isActive = (url: string, exact = false) =>
    exact ? location.pathname === url : location.pathname.startsWith(url);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "AD";

  if (isLoading) return null;
  if (!isAuthenticated || user?.role !== "platform_admin") return null;

  const mobilePrimaryItems: MobileNavItem[] = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
    { label: "Agents", href: "/admin/agents", icon: Building2 },
    { label: "Tenants", href: "/admin/tenants", icon: Users },
    { label: "Verify", href: "/admin/verifications", icon: ShieldCheck },
  ];

  const mobileMoreItems: MobileNavItem[] = [
    { label: "Properties", href: "/admin/properties", icon: Home },
    { label: "Landlords", href: "/admin/landlords", icon: UserSquare2 },
    { label: "Billing", href: "/admin/billing", icon: CreditCard },
    { label: "EARB", href: "/admin/earb", icon: BadgeCheck },
    { label: "Audit Log", href: "/admin/audit", icon: ScrollText },
    { label: "Sign Out", icon: LogOut, onClick: handleLogout },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden md:flex w-56 shrink-0 border-r flex-col bg-sidebar overflow-y-auto">
        <div className="p-4 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold text-sm">D</div>
            <div>
              <span className="font-heading font-semibold text-sm">Dwelly</span>
              <p className="text-[10px] text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    end={item.exact}
                    className={() =>
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
              </div>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t shrink-0 space-y-0.5">
          <NavLink to="/dashboard" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <ChevronLeft className="h-4 w-4" />Dashboard
          </NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-4 w-4" />Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between px-6 shrink-0">
          <p className="text-sm font-medium text-muted-foreground">Admin Portal</p>
          <div className="flex items-center gap-3">
            <button className="relative h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
              <Bell className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{initials}</div>
          </div>
        </header>
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav primaryItems={mobilePrimaryItems} moreItems={mobileMoreItems} />
    </div>
  );
}
