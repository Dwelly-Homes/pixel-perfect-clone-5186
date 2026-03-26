import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

type CommStatus = "pending" | "paid" | "disputed" | "waived";

const TABS: CommStatus[] = ["pending", "paid", "disputed", "waived"];
const TAB_LABELS: Record<CommStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  disputed: "Disputed",
  waived: "Waived",
};

const statusConfig: Record<CommStatus, { color: string; bg: string; icon: React.ElementType }> = {
  pending: { color: "text-amber-700", bg: "bg-amber-100", icon: Clock },
  paid: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 },
  disputed: { color: "text-red-700", bg: "bg-red-100", icon: AlertCircle },
  waived: { color: "text-gray-600", bg: "bg-gray-100", icon: CheckCircle2 },
};

export default function Commissions() {
  const [activeTab, setActiveTab] = useState<CommStatus | "all">("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data } = await api.get("/payments/commissions?limit=50");
      return data.data || [];
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commissions: any[] = data || [];

  const filtered = commissions.filter((c) => {
    if (activeTab !== "all" && c.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const propTitle = typeof c.propertyId === "object" ? c.propertyId?.title?.toLowerCase() : "";
      if (!propTitle.includes(q) && !(c.tenantName || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalPending = commissions.filter((c) => c.status === "pending").reduce((s: number, c: { amount?: number }) => s + (c.amount || 0), 0);
  const totalPaid = commissions.filter((c) => c.status === "paid").reduce((s: number, c: { amount?: number }) => s + (c.amount || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Commissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage commissions owed to Dwelly.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Pending", value: `KES ${totalPending.toLocaleString()}`, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Total Paid", value: `KES ${totalPaid.toLocaleString()}`, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Total Commissions", value: commissions.length, icon: DollarSign, color: "text-blue-600 bg-blue-50" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-heading font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab("all")}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              activeTab === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >All</button>
          {TABS.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search commissions…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-56" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Property", "Tenant", "Move-in", "Rent", "Rate", "Amount", "Status", "Due Date"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={8} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-sm text-muted-foreground">No commissions found.</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filtered.map((c: any) => {
                  const status = c.status as CommStatus;
                  const sc = statusConfig[status] || statusConfig.pending;
                  const StatusIcon = sc.icon;
                  const propTitle = typeof c.propertyId === "object" ? c.propertyId?.title : "—";

                  return (
                    <tr key={c._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium max-w-[140px] truncate">{propTitle}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{c.tenantName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {c.moveInDate ? new Date(c.moveInDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs">KES {c.monthlyRent?.toLocaleString() || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{c.commissionRate || 0}%</td>
                      <td className="px-4 py-3 text-xs font-semibold">KES {(c.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit", sc.bg, sc.color)}>
                          <StatusIcon className="h-3 w-3" />{TAB_LABELS[status] || status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {c.dueDate ? new Date(c.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {filtered.some((c) => c.status === "pending") && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <DollarSign className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">Pay commissions via M-Pesa</p>
            <p className="text-xs text-blue-700 mt-0.5">You can pay your outstanding commissions directly through M-Pesa. Contact support at support@dwellyhomes.co.ke to initiate payment.</p>
          </div>
          <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 hover:bg-blue-50 shrink-0"
            onClick={() => toast.info("Contact support@dwellyhomes.co.ke to pay commissions via M-Pesa")}>
            Pay Now
          </Button>
        </div>
      )}
    </div>
  );
}
