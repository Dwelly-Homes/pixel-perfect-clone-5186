import {
  Home,
  Building2,
  Plus,
  MessageSquare,
  MessagesSquare,
  Bell,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Calendar,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Building,
  UserPlus,
  Banknote,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { title: string; url: string; icon: React.ElementType; roles?: UserRole[] };

const mainNav: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "My Properties", url: "/dashboard/properties", icon: Building2, roles: ["tenant_admin", "agent_staff"] },
  { title: "Add Property", url: "/dashboard/properties/new", icon: Plus, roles: ["tenant_admin", "agent_staff"] },
  { title: "Inquiries", url: "/dashboard/inquiries", icon: MessageSquare, roles: ["tenant_admin", "agent_staff"] },
  { title: "Viewings", url: "/dashboard/viewings", icon: Calendar, roles: ["tenant_admin", "agent_staff"] },
  { title: "Messages", url: "/dashboard/chat", icon: MessagesSquare },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
];

const manageNav: NavItem[] = [
  { title: "Rent Payments", url: "/dashboard/rent-payments", icon: Banknote, roles: ["tenant_admin", "agent_staff"] },
  { title: "Team", url: "/dashboard/team", icon: Users, roles: ["tenant_admin"] },
  { title: "Commissions", url: "/dashboard/commissions", icon: DollarSign, roles: ["tenant_admin"] },
  { title: "Verification", url: "/dashboard/verification", icon: ShieldCheck, roles: ["tenant_admin"] },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard, roles: ["tenant_admin"] },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3, roles: ["tenant_admin"] },
];

const settingsNav: NavItem[] = [
  { title: "Organization", url: "/dashboard/settings/organization", icon: Building, roles: ["tenant_admin"] },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const canSee = (item: NavItem) => !item.roles || item.roles.includes(user?.role as UserRole);
  const visibleMain = mainNav.filter(canSee);
  const visibleManage = manageNav.filter(canSee);
  const visibleSettings = settingsNav.filter(canSee);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      await api.post("/auth/logout", { refreshToken });
    } catch { /* ignore */ }
    logout();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname.startsWith(path);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <NavLink
          to="/"
          className="flex items-center gap-2 overflow-hidden"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-heading font-bold text-sm">
            D
          </div>
          {!collapsed && (
            <span className="font-heading text-lg font-semibold text-sidebar-foreground truncate">
              Dwelly
            </span>
          )}
        </NavLink>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url} end={item.url === "/dashboard"}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {visibleManage.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Manage</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleManage.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <NavLink to={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleSettings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Back to Marketplace" asChild>
              <NavLink to="/">
                <ChevronLeft className="h-4 w-4" />
                <span>Marketplace</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign Out" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
