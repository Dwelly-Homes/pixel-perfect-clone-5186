import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";

function getDaysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getExpiryStatus(days: number): { label: string; color: string; bg: string; icon: React.ElementType } {
  if (days < 0) return { label: "Expired", color: "text-red-700", bg: "bg-red-100", icon: XCircle };
  if (days <= 14) return { label: `${days}d left`, color: "text-red-700", bg: "bg-red-100", icon: AlertTriangle };
  if (days <= 30) return { label: `${days}d left`, color: "text-amber-700", bg: "bg-amber-100", icon: Clock };
  if (days <= 60) return { label: `${days}d left`, color: "text-yellow-700", bg: "bg-yellow-100", icon: Clock };
  return { label: `${days}d left`, color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 };
}

const TABS = ["All", "Expired", "Expiring Soon", "Valid"] as const;

export default function AdminEarbTracker() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["earbTracker"],
    queryFn: async () => {
      const { data } = await api.get("/admin/earb-tracker");
      return data.data || [];
    },
  });

  const sendRemindersMutation = useMutation({
    mutationFn: () => api.post("/admin/earb/send-reminders"),
    onSuccess: () => {
      toast.success("Renewal reminders sent to all expiring agents");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const markRenewedMutation = useMutation({
    mutationFn: (tenantId: string) => api.patch(`/admin/earb/${tenantId}/renew`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["earbTracker"] });
      toast.success("EARB certificate marked as renewed");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const agents: any[] = data || [];

  const withDays = agents.map((a) => ({
    ...a,
    days: a.earbExpiryDate ? getDaysUntilExpiry(a.earbExpiryDate) : 999,
  }));

  const filtered = withDays.filter((a) => {
    if (tab === "Expired" && a.days >= 0) return false;
    if (tab === "Expiring Soon" && (a.days < 0 || a.days > 30)) return false;
    if (tab === "Valid" && a.days <= 30) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!a.businessName?.toLowerCase().includes(q) && !a.earbNumber?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const expired = withDays.filter((a) => a.days < 0).length;
  const expiringSoon = withDays.filter((a) => a.days >= 0 && a.days <= 30).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold">EARB Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor Estate Agents Registration Board certificate expiry dates.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => sendRemindersMutation.mutate()} disabled={sendRemindersMutation.isPending}>
          <RefreshCw className="h-4 w-4 mr-1.5" />Send All Reminders
        </Button>
      </div>

      {(expired > 0 || expiringSoon > 0) && (
        <div className="flex gap-4 flex-wrap">
          {expired > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">{expired} expired certificate{expired > 1 ? "s" : ""}</p>
                <p className="text-xs text-red-700">Listings may be hidden for these agents</p>
              </div>
            </div>
          )}
          {expiringSoon > 0 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800">{expiringSoon} certificate{expiringSoon > 1 ? "s" : ""} expiring within 30 days</p>
                <p className="text-xs text-amber-700">Agents have been notified to renew</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}>
              {t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search by name or EARB number…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-64" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Agency", "EARB Number", "Email", "Expiry Date", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    <td colSpan={6} className="px-4 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No agents found.</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filtered.map((a: any) => {
                  const es = getExpiryStatus(a.days);
                  const StatusIcon = es.icon;
                  return (
                    <tr key={a._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{a.businessName || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{a.contactPhone || "—"}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{a.earbNumber || "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.contactEmail || "—"}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {a.earbExpiryDate
                          ? new Date(a.earbExpiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit", es.bg, es.color)}>
                          <StatusIcon className="h-3 w-3" />{es.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="h-7 text-xs"
                          onClick={() => markRenewedMutation.mutate(a._id)}
                          disabled={markRenewedMutation.isPending}>
                          <RefreshCw className="h-3 w-3 mr-1" />Mark Renewed
                        </Button>
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
