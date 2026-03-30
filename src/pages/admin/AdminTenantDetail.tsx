import { useState } from "react";
import { ArrowLeft, User, Home, CreditCard, FileText, Building2, Shield } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";

const TABS = ["Overview", "Properties", "Team", "Billing", "Audit"] as const;

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  pending_verification: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-600",
};

const verifColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  documents_uploaded: "bg-blue-100 text-blue-700",
  under_review: "bg-blue-100 text-blue-700",
  information_requested: "bg-amber-100 text-amber-700",
  not_submitted: "bg-gray-100 text-gray-500",
};

function fmt(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

export default function AdminTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminTenantDetail", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/tenants/${id}`);
      return data?.data as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tenant: any; users: any[]; properties: any[]; payments: any[]; auditLogs: any[];
      };
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTenantDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["adminTenants"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="grid grid-cols-2 gap-4 mt-6">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-center text-sm text-muted-foreground">
        Failed to load tenant. <Button variant="link" onClick={() => navigate("/admin/tenants")}>Go back</Button>
      </div>
    );
  }

  const { tenant, users, properties, payments, auditLogs } = data;
  const isAgent = tenant.accountType === "estate_agent";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-heading font-bold truncate">{tenant.businessName}</h1>
            <Badge className={cn("border-0 text-[10px]", statusColors[tenant.status] || "bg-gray-100 text-gray-600")}>
              {tenant.status?.replace(/_/g, " ")}
            </Badge>
            <Badge className={cn("border-0 text-[10px]", isAgent ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700")}>
              {isAgent ? "Estate Agent" : "Landlord"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{tenant.contactEmail} · {tenant.contactPhone}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {tenant.status === "active" ? (
            <Button
              variant="outline" size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => statusMutation.mutate("suspended")}
              disabled={statusMutation.isPending}
            >
              Suspend
            </Button>
          ) : tenant.status === "suspended" && (
            <Button
              variant="outline" size="sm"
              className="text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => statusMutation.mutate("active")}
              disabled={statusMutation.isPending}
            >
              Reinstate
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b">
        {TABS.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === tb ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tb}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4" />Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              <Row label="Business Name" value={tenant.businessName} />
              <Row label="Account Type" value={isAgent ? "Estate Agent" : "Landlord"} />
              <Row label="Email" value={tenant.contactEmail} />
              <Row label="Phone" value={tenant.contactPhone} />
              <Row label="County" value={tenant.county} />
              <Row label="Address" value={tenant.physicalAddress} />
              <Row label="Registered" value={fmt(tenant.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />Verification & Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0.5">
              <Row label="Verification" value={
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", verifColors[tenant.verificationStatus] || "bg-gray-100 text-gray-500")}>
                  {tenant.verificationStatus?.replace(/_/g, " ") || "—"}
                </span>
              } />
              <Row label="Plan" value={<span className="capitalize">{tenant.subscriptionPlan}</span>} />
              <Row label="Plan Expires" value={fmt(tenant.subscriptionExpiresAt)} />
              {isAgent && (
                <>
                  <Row label="EARB Number" value={tenant.earbNumber} />
                  <Row label="EARB Expiry" value={fmt(tenant.earbExpiryDate)} />
                </>
              )}
              <Row label="Active Listings" value={`${tenant.activeListings ?? 0} / ${tenant.totalListings ?? 0}`} />
            </CardContent>
          </Card>

          {tenant.bio && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tenant.bio}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Properties */}
      {tab === "Properties" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Home className="h-4 w-4" />Listings ({properties.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Title", "Status", "Rent", "Inquiries", "Listed"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">No listings yet.</td></tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  properties.map((p: any) => (
                    <tr key={p._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium max-w-[200px] truncate">{p.title}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          p.status === "available" ? "bg-green-100 text-green-700" :
                          p.status === "draft" ? "bg-gray-100 text-gray-600" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">KES {(p.monthlyRent ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.inquiryCount ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(p.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Team */}
      {tab === "Team" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />Team Members ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">No team members found.</td></tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  users.map((u: any) => (
                    <tr key={u._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium">{u.fullName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3 text-xs capitalize">{u.role?.replace(/_/g, " ")}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        )}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(u.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Billing */}
      {tab === "Billing" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />Payment History ({payments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Date", "Amount", "Type", "Status", "Reference"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">No payments recorded.</td></tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  payments.map((p: any) => (
                    <tr key={p._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmt(p.createdAt)}</td>
                      <td className="px-4 py-3 text-xs font-medium">KES {(p.amount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs capitalize text-muted-foreground">{p.type?.replace(/_/g, " ") || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          p.status === "success" ? "bg-green-100 text-green-700" :
                          p.status === "failed" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.mpesaRef || p.reference || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Audit */}
      {tab === "Audit" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />Audit Log ({auditLogs.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {auditLogs.length === 0 ? (
                <p className="px-4 py-8 text-center text-xs text-muted-foreground">No audit events recorded.</p>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                auditLogs.map((log: any) => (
                  <div key={log._id} className="px-4 py-3 flex items-start gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">{log.action?.replace(/_/g, " ")}</p>
                      {log.actor && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">by {log.actor.fullName ?? log.actor}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{fmt(log.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
