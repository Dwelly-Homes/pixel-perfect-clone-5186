import { useEffect } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { NotificationBell } from "./NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import type { MobileNavItem } from "@/components/MobileBottomNav";
import { Home, Building2, MessageSquare, MessagesSquare } from "lucide-react";

function DashboardMobileNav() {
  const { toggleSidebar } = useSidebar();
  const { user } = useAuth();
  const canSee = (roles?: UserRole[]) => !roles || roles.includes(user?.role as UserRole);

  const primaryItems: MobileNavItem[] = [
    { label: "Home", href: "/dashboard", icon: Home, exact: true },
    ...(canSee(["tenant_admin", "agent_staff"])
      ? [{ label: "Properties", href: "/dashboard/properties", icon: Building2 }]
      : []),
    ...(canSee(["tenant_admin", "agent_staff"])
      ? [{ label: "Inquiries", href: "/dashboard/inquiries", icon: MessageSquare }]
      : []),
    { label: "Messages", href: "/dashboard/chat", icon: MessagesSquare },
  ];

  return <MobileBottomNav primaryItems={primaryItems} onMoreClick={toggleSidebar} />;
}

export function DashboardLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="hidden md:flex" />
              <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">
                Property Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {initials}
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <Outlet />
          </main>
        </div>
      </div>
      <DashboardMobileNav />
    </SidebarProvider>
  );
}
