import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import PropertyDetail from "./pages/PropertyDetail.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import VerifyOTP from "./pages/VerifyOTP.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import InviteAccept from "./pages/InviteAccept.tsx";
import AgentProfile from "./pages/marketplace/AgentProfile.tsx";
import { DashboardLayout } from "./components/dashboard/DashboardLayout.tsx";
import DashboardHome from "./pages/dashboard/DashboardHome.tsx";
import PropertyList from "./pages/dashboard/PropertyList.tsx";
import PropertyForm from "./pages/dashboard/PropertyForm.tsx";
import PropertyMedia from "./pages/dashboard/PropertyMedia.tsx";
import TeamMembers from "./pages/dashboard/TeamMembers.tsx";
import InviteMember from "./pages/dashboard/InviteMember.tsx";
import Inquiries from "./pages/dashboard/Inquiries.tsx";
import Viewings from "./pages/dashboard/Viewings.tsx";
import Notifications from "./pages/dashboard/Notifications.tsx";
import Chat from "./pages/dashboard/Chat.tsx";
import Verification from "./pages/dashboard/Verification.tsx";
import Commissions from "./pages/dashboard/Commissions.tsx";
import RentPayments from "./pages/dashboard/RentPayments.tsx";
import Billing from "./pages/dashboard/Billing.tsx";
import BillingPlans from "./pages/dashboard/BillingPlans.tsx";
import BillingHistory from "./pages/dashboard/BillingHistory.tsx";
import OrganizationSettings from "./pages/dashboard/OrganizationSettings.tsx";
import TenantLayout from "./components/tenant/TenantLayout.tsx";
import TenantOnboarding from "./pages/tenant/TenantOnboarding.tsx";
import TenantDashboard from "./pages/tenant/TenantDashboard.tsx";
import TenantBookings from "./pages/tenant/TenantBookings.tsx";
import TenantPayments from "./pages/tenant/TenantPayments.tsx";
import TenantSaved from "./pages/tenant/TenantSaved.tsx";
import TenantMessages from "./pages/tenant/TenantMessages.tsx";
import TenantNotifications from "./pages/tenant/TenantNotifications.tsx";
import TenantProfile from "./pages/tenant/TenantProfile.tsx";
import LandlordOnboarding from "./pages/landlord/LandlordOnboarding.tsx";
import LandlordDashboard from "./pages/landlord/LandlordDashboard.tsx";
import LandlordInquiries from "./pages/landlord/LandlordInquiries.tsx";
import { AdminLayout } from "./components/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminVerifications from "./pages/admin/AdminVerifications.tsx";
import AdminVerificationReview from "./pages/admin/AdminVerificationReview.tsx";
import AdminTenants from "./pages/admin/AdminTenants.tsx";
import AdminTenantDetail from "./pages/admin/AdminTenantDetail.tsx";
import AdminEarbTracker from "./pages/admin/AdminEarbTracker.tsx";
import AdminAuditLog from "./pages/admin/AdminAuditLog.tsx";
import AdminAgents from "./pages/admin/AdminAgents.tsx";
import AdminAgentDetail from "./pages/admin/AdminAgentDetail.tsx";
import AdminLandlords from "./pages/admin/AdminLandlords.tsx";
import AdminLandlordDetail from "./pages/admin/AdminLandlordDetail.tsx";
import AdminProperties from "./pages/admin/AdminProperties.tsx";
import AdminBilling from "./pages/admin/AdminBilling.tsx";
import AdminDisputes from "./pages/admin/AdminDisputes.tsx";
import AdminNotifications from "./pages/admin/AdminNotifications.tsx";

const queryClient = new QueryClient();

function RoleGuard({ roles, children }: { roles: UserRole[]; children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/marketplace/:id" element={<PropertyDetail />} />
          <Route path="/marketplace/agents/:slug" element={<AgentProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/invite/:token" element={<InviteAccept />} />
          <Route path="/tenant" element={<TenantLayout />}>
            <Route index element={<TenantDashboard />} />
            <Route path="bookings" element={<TenantBookings />} />
            <Route path="payments" element={<TenantPayments />} />
            <Route path="saved" element={<TenantSaved />} />
            <Route path="messages" element={<TenantMessages />} />
            <Route path="notifications" element={<TenantNotifications />} />
            <Route path="profile" element={<TenantProfile />} />
          </Route>
          <Route path="/tenant/onboarding" element={<TenantOnboarding />} />
          <Route path="/landlord" element={<LandlordDashboard />} />
          <Route path="/landlord/onboarding" element={<LandlordOnboarding />} />
          <Route path="/landlord/inquiries" element={<LandlordInquiries />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="properties" element={<RoleGuard roles={["tenant_admin", "agent_staff"]}><PropertyList /></RoleGuard>} />
            <Route path="properties/new" element={<RoleGuard roles={["tenant_admin", "agent_staff"]}><PropertyForm /></RoleGuard>} />
            <Route path="properties/:id/edit" element={<RoleGuard roles={["tenant_admin", "agent_staff"]}><PropertyForm /></RoleGuard>} />
            <Route path="properties/:id/media" element={<RoleGuard roles={["tenant_admin", "agent_staff"]}><PropertyMedia /></RoleGuard>} />
            <Route path="team" element={<RoleGuard roles={["tenant_admin"]}><TeamMembers /></RoleGuard>} />
            <Route path="team/invite" element={<RoleGuard roles={["tenant_admin"]}><InviteMember /></RoleGuard>} />
            <Route path="inquiries" element={<RoleGuard roles={["tenant_admin", "agent_staff"]}><Inquiries /></RoleGuard>} />
            <Route path="viewings" element={<RoleGuard roles={["tenant_admin", "agent_staff"]}><Viewings /></RoleGuard>} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="chat" element={<Chat />} />
            <Route path="verification" element={<RoleGuard roles={["tenant_admin"]}><Verification /></RoleGuard>} />
            <Route path="rent-payments" element={<RoleGuard roles={["tenant_admin", "agent_staff"]}><RentPayments /></RoleGuard>} />
            <Route path="commissions" element={<RoleGuard roles={["tenant_admin"]}><Commissions /></RoleGuard>} />
            <Route path="billing" element={<RoleGuard roles={["tenant_admin"]}><Billing /></RoleGuard>} />
            <Route path="billing/plans" element={<RoleGuard roles={["tenant_admin"]}><BillingPlans /></RoleGuard>} />
            <Route path="billing/history" element={<RoleGuard roles={["tenant_admin"]}><BillingHistory /></RoleGuard>} />
            <Route path="settings/organization" element={<RoleGuard roles={["tenant_admin"]}><OrganizationSettings /></RoleGuard>} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="verifications" element={<AdminVerifications />} />
            <Route path="verifications/:id" element={<AdminVerificationReview />} />
            <Route path="tenants" element={<AdminTenants />} />
            <Route path="tenants/:id" element={<AdminTenantDetail />} />
            <Route path="earb" element={<AdminEarbTracker />} />
            <Route path="audit" element={<AdminAuditLog />} />
            <Route path="agents" element={<AdminAgents />} />
            <Route path="agents/:id" element={<AdminAgentDetail />} />
            <Route path="landlords" element={<AdminLandlords />} />
            <Route path="landlords/:id" element={<AdminLandlordDetail />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
