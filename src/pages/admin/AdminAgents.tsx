import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, UserCheck, UserX, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";

const TABS = ["All", "active", "suspended", "pending_verification"] as const;
const TAB_LABELS: Record<string, string> = {
  All: "All",
  active: "Active",
  suspended: "Suspended",
  pending_verification: "Pending",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  pending_verification: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-600",
};

export default function AdminAgents() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["adminAgents", tab],
    queryFn: async () => {
      const params = new URLSearchParams({ accountType: "estate_agent", limit: "50" });
      if (tab !== "All") params.set("status", tab);
      const { data } = await api.get(`/tenants?${params.toString()}`);
      return data;
    },
  });

  const toggleStatusMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAgents"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents: any[] = data?.data || [];
  const total = data?.pagination?.total ?? 0;

  const filtered = agents.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.businessName?.toLowerCase().includes(q) || a.contactEmail?.toLowerCase().includes(q);
  });

  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Agents & Agencies</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all registered estate agents on the platform.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Agencies", value: total },
          { label: "Active Agencies", value: activeCount },
          { label: "Pending Review", value: agents.filter((a) => a.status === "pending_verification").length },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-heading font-bold mt-0.5">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}>
              {TAB_LABELS[t] || t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search agents…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-60" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Agency", "Contact", "County", "EARB Expiry", "Verification", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={7} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No agents found.</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filtered.map((a: any) => {
                  const earbExpiry = a.earbExpiryDate ? new Date(a.earbExpiryDate) : null;
                  const today = new Date();
                  const daysLeft = earbExpiry ? Math.ceil((earbExpiry.getTime() - today.getTime()) / 86400000) : null;
                  const earbWarning = daysLeft !== null && (daysLeft < 0 || daysLeft <= 30);

                  return (
                    <tr key={a._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{a.businessName || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{a.contactEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.contactPhone || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.county || "—"}</td>
                      <td className="px-4 py-3">
                        {earbExpiry ? (
                          <div className={cn("flex items-center gap-1 text-xs", earbWarning ? "text-red-600" : "text-muted-foreground")}>
                            {earbWarning && <AlertTriangle className="h-3 w-3 shrink-0" />}
                            {earbExpiry.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          a.verificationStatus === "approved" ? "bg-green-100 text-green-700" :
                          a.verificationStatus === "rejected" ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        )}>
                          {a.verificationStatus?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[a.status] || "bg-gray-100 text-gray-600")}>
                          {a.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                            <Link to={`/admin/agents/${a._id}`}><Eye className="h-3.5 w-3.5" /></Link>
                          </Button>
                          {a.status === "active" ? (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => toggleStatusMutation.mutate({ id: a._id, status: "suspended" })}>
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          ) : a.status === "suspended" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => toggleStatusMutation.mutate({ id: a._id, status: "active" })}>
                              <UserCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
