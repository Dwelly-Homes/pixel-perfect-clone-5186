import { useState } from "react";
import { ArrowLeft, Home, CreditCard, Users, Mail, Phone, MapPin, CheckCircle2, UserX, UserCheck, XCircle, ShieldCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";

const TABS = ["Overview", "Properties", "Team", "Billing"] as const;

const propertyStatusColors: Record<string, string> = {
  available: "bg-blue-100 text-blue-700",
  rented: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  expired: "bg-red-100 text-red-700",
};

const verificationColors: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  documents_uploaded: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  not_submitted: "bg-gray-100 text-gray-600",
};

export default function AdminLandlordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["adminLandlordDetail", id],
    queryFn: async () => {
      const { data } = await api.get(`/admin/tenants/${id}`);
      return data.data as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tenant: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        users: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        properties: any[];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        payments: any[];
      };
    },
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/tenants/${id}/status`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["adminLandlordDetail", id] });
      queryClient.invalidateQueries({ queryKey: ["adminLandlords"] });
      toast.success(`Landlord ${status === "active" ? "reinstated" : "suspended"}`);
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl">
        <div className="h-8 bg-muted rounded w-64 animate-pulse" />
        <div className="h-4 bg-muted rounded w-48 animate-pulse" />
        <div className="grid grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-5xl">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/landlords")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="mt-8 text-center text-muted-foreground">
          <XCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>Landlord not found or could not be loaded.</p>
        </div>
      </div>
    );
  }

  const { tenant, users, properties, payments } = data;

  const rentedListings = properties.filter((p) => p.status === "rented").length;
  const occupancyRate = properties.length > 0 ? Math.round((rentedListings / properties.length) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/landlords")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-heading font-bold">{tenant.businessName}</h1>
            <Badge className={tenant.status === "active" ? "bg-green-100 text-green-700 border-0" : "bg-red-100 text-red-700 border-0"}>
              {tenant.status}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">{tenant.subscriptionPlan} Plan</Badge>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", verificationColors[tenant.verificationStatus] || "bg-gray-100 text-gray-600")}>
              {tenant.verificationStatus?.replace(/_/g, " ") || "—"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {tenant.contactEmail} · Member since {new Date(tenant.createdAt).toLocaleDateString("en-KE", { month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="shrink-0">
          {tenant.status === "active" ? (
            <Button variant="destructive" size="sm" disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("suspended")}>
              <UserX className="h-4 w-4 mr-2" />Suspend
            </Button>
          ) : (
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" disabled={statusMutation.isPending}
              onClick={() => statusMutation.mutate("active")}>
              <UserCheck className="h-4 w-4 mr-2" />Reinstate
            </Button>
          )}
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-0 border-b">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn("px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === tb ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {tb}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Properties", value: properties.length, icon: Home },
              { label: "Occupancy", value: `${occupancyRate}%`, icon: CheckCircle2 },
              { label: "Team Members", value: users.length, icon: Users },
              { label: "Payments", value: payments.length, icon: CreditCard },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-heading font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Contact & Location</CardTitle></CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{tenant.contactEmail || "—"}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{tenant.contactPhone || "—"}</div>
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{tenant.physicalAddress || tenant.county || "—"}</div>
                {tenant.bio && <p className="text-xs text-muted-foreground pt-1 border-t">{tenant.bio}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Occupancy & Plan</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Properties occupied</span>
                    <span className="font-medium">{rentedListings} / {properties.length}</span>
                  </div>
                  <Progress value={occupancyRate} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 bg-muted/40 rounded text-center">
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="text-sm font-semibold capitalize">{tenant.subscriptionPlan}</p>
                  </div>
                  <div className="p-2 bg-muted/40 rounded text-center">
                    <p className="text-xs text-muted-foreground">Verification</p>
                    <p className="text-sm font-semibold capitalize">{tenant.verificationStatus?.replace(/_/g, " ") || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {tenant.adminNotes && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Admin Notes</p>
                <p className="text-sm text-amber-700 mt-0.5">{tenant.adminNotes}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Properties */}
      {tab === "Properties" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Property", "Monthly Rent", "Status", "Inquiries", "Listed On"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {properties.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No properties found.</td></tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  properties.map((p: any) => (
                    <tr key={p._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium">{p.title}</td>
                      <td className="px-4 py-3 text-xs font-medium">KES {(p.monthlyRent || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", propertyStatusColors[p.status] || "bg-gray-100 text-gray-600")}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.inquiryCount ?? 0}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
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
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Name", "Email", "Role", "Status", "Joined"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No team members found.</td></tr>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  users.map((u: any) => (
                    <tr key={u._id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-xs font-medium">{u.fullName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium capitalize">{u.role?.replace(/_/g, " ")}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600")}>
                          {u.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
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
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Current Plan</p>
              <p className="font-heading font-bold text-lg mt-1 capitalize">{tenant.subscriptionPlan}</p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Plan Expiry</p>
              <p className="font-heading font-bold text-lg mt-1">
                {tenant.subscriptionExpiresAt
                  ? new Date(tenant.subscriptionExpiresAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })
                  : "—"}
              </p>
            </CardContent></Card>
            <Card><CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground">Total Transactions</p>
              <p className="font-heading font-bold text-lg mt-1">{payments.length}</p>
            </CardContent></Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Date", "Type", "Amount", "Status", "Reference"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No payment history.</td></tr>
                  ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    payments.map((b: any, i: number) => (
                      <tr key={b._id || i} className="border-b last:border-0">
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(b.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3 text-xs capitalize">{b.type?.replace(/_/g, " ") || "—"}</td>
                        <td className="px-4 py-3 text-xs font-medium">KES {(b.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            b.status === "success" ? "bg-green-100 text-green-700" :
                            b.status === "failed" ? "bg-red-100 text-red-700" :
                            "bg-amber-100 text-amber-700"
                          )}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{b.mpesaReceiptNumber || b.reference || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
