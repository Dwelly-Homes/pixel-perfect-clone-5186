import { useQuery } from "@tanstack/react-query";
import { Users, ShieldCheck, Building2, AlertTriangle, Clock, CheckCircle2, XCircle, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const statusColors: Record<string, string> = {
  documents_uploaded: "bg-amber-100 text-amber-700",
  under_review: "bg-blue-100 text-blue-700",
  information_requested: "bg-orange-100 text-orange-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  not_submitted: "bg-gray-100 text-gray-600",
};

const statusLabel: Record<string, string> = {
  documents_uploaded: "Pending",
  under_review: "Under Review",
  information_requested: "Info Requested",
  approved: "Approved",
  rejected: "Rejected",
  not_submitted: "Not Submitted",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function activityTypeInfo(action: string): { type: string; icon: React.ElementType } {
  if (action.includes("APPROVE") || action.includes("RENEW")) return { type: "success", icon: CheckCircle2 };
  if (action.includes("REJECT") || action.includes("SUSPEND") || action.includes("DELETE")) return { type: "error", icon: XCircle };
  if (action.includes("REQUEST") || action.includes("WARN")) return { type: "warning", icon: AlertTriangle };
  return { type: "info", icon: TrendingUp };
}

const activityColors: Record<string, string> = {
  success: "bg-green-100 text-green-600",
  warning: "bg-amber-100 text-amber-600",
  error: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-600",
};

export default function AdminDashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data.data;
    },
  });

  const { data: activityData } = useQuery({
    queryKey: ["adminActivity"],
    queryFn: async () => {
      const { data } = await api.get("/admin/activity-feed?limit=6");
      return data.data || [];
    },
  });

  const { data: verificationsData } = useQuery({
    queryKey: ["adminVerifications"],
    queryFn: async () => {
      const { data } = await api.get("/verification/admin?limit=5");
      return data.data || [];
    },
  });

  const stats = statsData ? [
    { label: "Active Tenants", value: statsData.totalActiveTenants ?? 0, delta: "on the platform", icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: "Pending Verifications", value: statsData.pendingVerifications ?? 0, delta: "awaiting review", icon: Clock, color: "text-amber-600 bg-amber-50" },
    { label: "Active Listings", value: statsData.totalListingsLive ?? 0, delta: "available now", icon: Building2, color: "text-green-600 bg-green-50" },
    { label: "Failed Payments", value: statsData.failedPayments ?? 0, delta: "need attention", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health and key metrics at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-heading font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.delta}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Verifications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />Recent Verifications
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs text-secondary">
                  <Link to="/admin/verifications">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(verificationsData || []).length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground text-center">No verifications yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {["Name", "Type", "Submitted", "Status"].map((h) => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(verificationsData || []).map((v: any) => (
                      <tr key={v._id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 text-xs font-medium">
                          {typeof v.tenantId === "object" ? v.tenantId?.businessName : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">
                            {typeof v.tenantId === "object" ? v.tenantId?.accountType?.replace("_", " ") : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {v.submittedAt ? new Date(v.submittedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[v.status] || "bg-gray-100 text-gray-600")}>
                            {statusLabel[v.status] || v.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(activityData || []).length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No activity yet.</p>
            ) : (
              <div className="divide-y">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(activityData || []).map((a: any, i: number) => {
                  const { type, icon: Icon } = activityTypeInfo(a.action || "");
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", activityColors[type])}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs">{a.action?.toLowerCase().replace(/_/g, " ")} <span className="font-medium">{a.actorEmail || ""}</span></p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
