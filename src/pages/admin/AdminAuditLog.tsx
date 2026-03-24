import { useState } from "react";
import { Search, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ActionType = "verification" | "listing" | "account" | "payment" | "admin";

interface AuditEntry {
  id: string;
  timestamp: string;
  admin: string;
  action: string;
  subject: string;
  type: ActionType;
  ip: string;
  details?: string;
}

const LOGS: AuditEntry[] = [
  { id: "1", timestamp: "2024-06-20T14:32:00", admin: "Admin User", action: "Approved verification", subject: "James Kariuki", type: "verification", ip: "41.90.64.12" },
  { id: "2", timestamp: "2024-06-20T13:15:00", admin: "Admin User", action: "Requested more info", subject: "KeyHomes Agency", type: "verification", ip: "41.90.64.12", details: "ID photos unclear" },
  { id: "3", timestamp: "2024-06-20T11:00:00", admin: "Super Admin", action: "Suspended agent", subject: "FastLet Ltd", type: "account", ip: "197.232.1.45", details: "Multiple complaints from tenants" },
  { id: "4", timestamp: "2024-06-19T16:45:00", admin: "Admin User", action: "Removed listing", subject: "Suspicious 1BR in CBD", type: "listing", ip: "41.90.64.12", details: "Fraudulent listing report" },
  { id: "5", timestamp: "2024-06-19T09:20:00", admin: "Super Admin", action: "Rejected verification", subject: "Nairobi Realty Ltd", type: "verification", ip: "197.232.1.45", details: "Expired EARB certificate" },
  { id: "6", timestamp: "2024-06-18T15:30:00", admin: "Admin User", action: "Waived commission", subject: "Grace Akinyi", type: "payment", ip: "41.90.64.12" },
  { id: "7", timestamp: "2024-06-18T10:00:00", admin: "Super Admin", action: "Created admin account", subject: "New Admin", type: "admin", ip: "197.232.1.45" },
  { id: "8", timestamp: "2024-06-17T14:10:00", admin: "Admin User", action: "Flagged tenant", subject: "Amina Hassan", type: "account", ip: "41.90.64.12", details: "Reports of property damage" },
  { id: "9", timestamp: "2024-06-17T09:00:00", admin: "Admin User", action: "Updated EARB status", subject: "TopFlat Agency", type: "verification", ip: "41.90.64.12", details: "EARB certificate expired" },
  { id: "10", timestamp: "2024-06-16T16:00:00", admin: "Super Admin", action: "Approved verification", subject: "Sarah Mutua", type: "verification", ip: "197.232.1.45" },
];

const typeColors: Record<ActionType, string> = {
  verification: "bg-blue-100 text-blue-700",
  listing: "bg-purple-100 text-purple-700",
  account: "bg-amber-100 text-amber-700",
  payment: "bg-green-100 text-green-700",
  admin: "bg-red-100 text-red-700",
};

export default function AdminAuditLog() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all");

  const admins = [...new Set(LOGS.map((l) => l.admin))];

  const filtered = LOGS.filter((l) => {
    if (typeFilter !== "all" && l.type !== typeFilter) return false;
    if (adminFilter !== "all" && l.admin !== adminFilter) return false;
    const q = search.toLowerCase();
    if (q && !l.action.toLowerCase().includes(q) && !l.subject.toLowerCase().includes(q)) return false;
    return true;
  });

  function exportCSV() {
    const header = "Timestamp,Admin,Action,Subject,Type,IP\n";
    const rows = filtered.map((l) => `"${l.timestamp}","${l.admin}","${l.action}","${l.subject}",${l.type},${l.ip}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "audit-log.csv"; a.click();
    toast({ title: "Audit log exported" });
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

      {/* Filters */}
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
        <Select value={adminFilter} onValueChange={setAdminFilter}>
          <SelectTrigger className="h-8 text-xs w-40">
            <SelectValue placeholder="Admin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Admins</SelectItem>
            {admins.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} entries</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Timestamp", "Admin", "Action", "Subject", "Type", "IP Address"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.timestamp).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    {" "}
                    <span className="font-mono">{new Date(l.timestamp).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" })}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{l.admin}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-xs">{l.action}</p>
                      {l.details && <p className="text-[10px] text-muted-foreground mt-0.5">{l.details}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{l.subject}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", typeColors[l.type])}>{l.type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No log entries found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
