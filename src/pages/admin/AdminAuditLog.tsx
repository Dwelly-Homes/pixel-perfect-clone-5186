import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const typeColors: Record<string, string> = {
  verification: "bg-blue-100 text-blue-700",
  listing: "bg-purple-100 text-purple-700",
  account: "bg-amber-100 text-amber-700",
  payment: "bg-green-100 text-green-700",
  admin: "bg-red-100 text-red-700",
  property: "bg-purple-100 text-purple-700",
  inquiry: "bg-teal-100 text-teal-700",
  notification: "bg-gray-100 text-gray-700",
};

function getActionCategory(action: string): string {
  if (action.includes("VERIFICATION") || action.includes("REVIEW")) return "verification";
  if (action.includes("PROPERTY") || action.includes("LISTING")) return "listing";
  if (action.includes("PAYMENT") || action.includes("BILLING")) return "payment";
  if (action.includes("ACCOUNT") || action.includes("SUSPEND") || action.includes("USER")) return "account";
  if (action.includes("INQUIRY")) return "inquiry";
  return "admin";
}

export default function AdminAuditLog() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["auditLog"],
    queryFn: async () => {
      const { data } = await api.get("/admin/audit-log?limit=100");
      return data;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const logs: any[] = data?.data || [];

  const filtered = logs.filter((l) => {
    const category = getActionCategory(l.action || "");
    if (typeFilter !== "all" && category !== typeFilter) return false;
    const q = search.toLowerCase();
    if (q) {
      const action = (l.action || "").toLowerCase();
      const actor = (l.actorEmail || l.actorId || "").toLowerCase();
      const resource = (l.resourceType || "").toLowerCase();
      if (!action.includes(q) && !actor.includes(q) && !resource.includes(q)) return false;
    }
    return true;
  });

  function exportCSV() {
    const header = "Timestamp,Actor,Action,Resource,IP\n";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = filtered.map((l: any) =>
      `"${l.createdAt}","${l.actorEmail || l.actorId || ""}","${l.action}","${l.resourceType || ""}","${l.ipAddress || ""}"`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">A record of all admin actions on the platform.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1.5" />Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search actions…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-56" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs w-36">
            <SelectValue placeholder="Action type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="verification">Verification</SelectItem>
            <SelectItem value="listing">Listing</SelectItem>
            <SelectItem value="account">Account</SelectItem>
            <SelectItem value="payment">Payment</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} entries</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Timestamp", "Actor", "Action", "Resource", "Type", "IP Address"].map((h) => (
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
                <tr><td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">No log entries found.</td></tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                filtered.map((l: any) => {
                  const category = getActionCategory(l.action || "");
                  return (
                    <tr key={l._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(l.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        {" "}
                        <span className="font-mono">{new Date(l.createdAt).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{l.actorEmail || l.actorId || "System"}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs">{(l.action || "").toLowerCase().replace(/_/g, " ")}</p>
                          {l.details && <p className="text-[10px] text-muted-foreground mt-0.5">{typeof l.details === "string" ? l.details : JSON.stringify(l.details)}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{l.resourceType || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", typeColors[category] || "bg-gray-100 text-gray-700")}>{category}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{l.ipAddress || "—"}</td>
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
