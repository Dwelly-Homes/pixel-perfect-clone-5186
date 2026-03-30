import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Eye, Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const LIMIT = 15;
type VerifStatus = "documents_uploaded" | "under_review" | "information_requested" | "approved" | "rejected" | "suspended" | "not_submitted";

const TABS = ["All", "documents_uploaded", "under_review", "information_requested", "approved", "rejected", "suspended"] as const;

const TAB_LABELS: Record<string, string> = {
  All: "All",
  documents_uploaded: "Pending",
  under_review: "Under Review",
  information_requested: "Info Requested",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

const statusConfig: Record<VerifStatus, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  not_submitted: { icon: Clock, color: "text-gray-600", bg: "bg-gray-100", label: "Not Submitted" },
  documents_uploaded: { icon: Clock, color: "text-amber-700", bg: "bg-amber-100", label: "Pending" },
  under_review: { icon: ShieldCheck, color: "text-blue-700", bg: "bg-blue-100", label: "Under Review" },
  information_requested: { icon: AlertCircle, color: "text-orange-700", bg: "bg-orange-100", label: "Info Requested" },
  approved: { icon: CheckCircle2, color: "text-green-700", bg: "bg-green-100", label: "Approved" },
  rejected: { icon: XCircle, color: "text-red-700", bg: "bg-red-100", label: "Rejected" },
  suspended: { icon: XCircle, color: "text-red-900", bg: "bg-red-200", label: "Suspended" },
};

export default function AdminVerifications() {
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["adminVerifications", tab, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
      if (tab !== "All") params.set("status", tab);
      const { data } = await api.get(`/verification/admin?${params.toString()}`);
      return data;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = data?.data || [];
  const total: number = data?.meta?.total ?? 0;
  const totalPages: number = data?.meta?.totalPages ?? 1;

  const filtered = items.filter((i) => {
    if (!search) return true;
    const name = typeof i.tenantId === "object" ? i.tenantId?.businessName?.toLowerCase() : "";
    const email = typeof i.tenantId === "object" ? i.tenantId?.contactEmail?.toLowerCase() : "";
    const q = search.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Verifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Review and manage agent and landlord verification requests.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {TAB_LABELS[t] || t}
            {t === "All" && total > 0 && (
              <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                tab === t ? "bg-white/20 text-white" : "bg-muted-foreground/20"
              )}>{total}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Name", "Type", "Email", "Submitted", "Docs", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No verifications found.</td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filtered.map((item: any) => {
                  const status = item.status as VerifStatus;
                  const sc = statusConfig[status] || statusConfig.not_submitted;
                  const StatusIcon = sc.icon;
                  const tenant = typeof item.tenantId === "object" ? item.tenantId : null;
                  const docsUploaded = item.documents?.length ?? 0;
                  const accountType = tenant?.accountType;
                  const docsTotal = accountType === "estate_agent" ? 5 : 3;

                  return (
                    <tr key={item._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium">{tenant?.businessName || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">
                          {accountType?.replace("_", " ") || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{tenant?.contactEmail || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {item.submittedAt
                          ? new Date(item.submittedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{docsUploaded}/{docsTotal}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit", sc.bg, sc.color)}>
                          <StatusIcon className="h-3 w-3" />{sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                          <Link to={`/admin/verifications/${item._id}`}><Eye className="h-3.5 w-3.5 mr-1" />Review</Link>
                        </Button>
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
