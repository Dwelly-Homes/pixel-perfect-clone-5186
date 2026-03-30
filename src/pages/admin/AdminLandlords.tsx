import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, UserX, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";

const LIMIT = 15;
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

export default function AdminLandlords() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["adminLandlords", tab, search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ accountType: "landlord", limit: String(LIMIT), page: String(page) });
      if (tab !== "All") params.set("status", tab);
      if (search) params.set("search", search);
      const { data } = await api.get(`/tenants?${params.toString()}`);
      return data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminLandlords"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landlords: any[] = data?.data || [];
  const total: number = data?.meta?.total ?? 0;
  const totalPages: number = data?.meta?.totalPages ?? 1;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Landlords</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all registered landlords on the platform.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Landlords", value: total },
          { label: "Active", value: landlords.filter((l) => l.status === "active").length },
          { label: "Pending Review", value: landlords.filter((l) => l.status === "pending_verification").length },
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
            <button key={t} onClick={() => { setTab(t); setPage(1); }}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}>
              {TAB_LABELS[t] || t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search landlords…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-xs w-60"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Name", "Contact", "County", "Verification", "Status", "Joined", ""].map((h) => (
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
              ) : landlords.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No landlords found.</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                landlords.map((l: any) => (
                  <tr key={l._id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{l.businessName || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">{l.contactEmail || "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.contactPhone || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.county || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        l.verificationStatus === "approved" ? "bg-green-100 text-green-700" :
                        l.verificationStatus === "rejected" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {l.verificationStatus?.replace(/_/g, " ") || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[l.status] || "bg-gray-100 text-gray-600")}>
                        {l.status || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                          <Link to={`/admin/landlords/${l._id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                        {l.status === "active" ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => toggleStatusMutation.mutate({ id: l._id, status: "suspended" })}>
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        ) : l.status === "suspended" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => toggleStatusMutation.mutate({ id: l._id, status: "active" })}>
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <span>{total} total · Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
