import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Eye, UserCheck, UserX, ChevronLeft, ChevronRight, Building2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";

const LIMIT = 20;

const STATUS_TABS = ["all", "active", "suspended", "pending_verification"] as const;
const STATUS_LABELS: Record<string, string> = {
  all: "All", active: "Active", suspended: "Suspended", pending_verification: "Pending",
};
const ACCOUNT_TABS = ["all", "estate_agent", "landlord"] as const;
const ACCOUNT_LABELS: Record<string, string> = {
  all: "All Types", estate_agent: "Estate Agents", landlord: "Landlords",
};

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

export default function AdminTenants() {
  const queryClient = useQueryClient();
  const [statusTab, setStatusTab] = useState<typeof STATUS_TABS[number]>("all");
  const [accountTab, setAccountTab] = useState<typeof ACCOUNT_TABS[number]>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["adminTenants", statusTab, accountTab, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
      if (statusTab !== "all") params.set("status", statusTab);
      if (accountTab !== "all") params.set("accountType", accountTab);
      if (search) params.set("search", search);
      const { data } = await api.get(`/admin/tenants?${params.toString()}`);
      return data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/tenants/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTenants"] });
      toast.success("Status updated");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants: any[] = Array.isArray(data?.data) ? data.data : [];
  const total: number = data?.meta?.total ?? 0;
  const totalPages: number = data?.meta?.totalPages ?? 1;

  const filtered = tenants.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.businessName?.toLowerCase().includes(q) ||
      t.contactEmail?.toLowerCase().includes(q) ||
      t.county?.toLowerCase().includes(q)
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Tenants</h1>
        <p className="text-sm text-muted-foreground mt-1">
          All registered business accounts — estate agents and landlords.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, icon: Users },
          { label: "Active", value: tenants.filter((t) => t.status === "active").length, icon: UserCheck },
          { label: "Suspended", value: tenants.filter((t) => t.status === "suspended").length, icon: UserX },
          { label: "Pending", value: tenants.filter((t) => t.status === "pending_verification").length, icon: Building2 },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-heading font-bold">{isLoading ? "—" : s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setStatusTab(t); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                  statusTab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
                )}
              >
                {STATUS_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Account type filter */}
          <div className="flex gap-1.5 ml-2">
            {ACCOUNT_TABS.map((t) => (
              <button
                key={t}
                onClick={() => { setAccountTab(t); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-colors border",
                  accountTab === t
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/40"
                )}
              >
                {ACCOUNT_LABELS[t]}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative ml-auto">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, county…"
              value={search}
              onChange={handleSearch}
              className="pl-8 h-8 text-xs w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Business", "Type", "Contact", "County", "Listings", "Verification", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={8} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-sm text-muted-foreground">
                    No tenants found.
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filtered.map((t: any) => {
                  const detailPath = t.accountType === "estate_agent"
                    ? `/admin/agents/${t._id}`
                    : `/admin/landlords/${t._id}`;

                  return (
                    <tr key={t._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{t.businessName || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{t.contactEmail || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          t.accountType === "estate_agent"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-violet-100 text-violet-700"
                        )}>
                          {t.accountType === "estate_agent" ? "Agent" : "Landlord"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.contactPhone || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.county || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {t.activeListings ?? 0} / {t.totalListings ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          verifColors[t.verificationStatus] || "bg-gray-100 text-gray-500"
                        )}>
                          {t.verificationStatus?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                          statusColors[t.status] || "bg-gray-100 text-gray-600"
                        )}>
                          {t.status?.replace(/_/g, " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                            <Link to={detailPath}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          {t.status === "active" ? (
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => toggleStatusMutation.mutate({ id: t._id, status: "suspended" })}
                            >
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          ) : t.status === "suspended" && (
                            <Button
                              variant="ghost" size="icon"
                              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => toggleStatusMutation.mutate({ id: t._id, status: "active" })}
                            >
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <span>{total} total · Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0"
                  disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2">{page} / {totalPages}</span>
                <Button
                  variant="outline" size="sm" className="h-7 w-7 p-0"
                  disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
                >
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
