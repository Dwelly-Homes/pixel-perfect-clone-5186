import { useState } from "react";
import { Search, Eye, Clock, CheckCircle2, XCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type VerifStatus = "Pending" | "Under Review" | "Info Requested" | "Approved" | "Rejected" | "Suspended";

interface VerifItem {
  id: string;
  name: string;
  type: "Estate Agent" | "Landlord";
  email: string;
  submitted: string;
  status: VerifStatus;
  docs: number;
  docsTotal: number;
}

const ITEMS: VerifItem[] = [
  { id: "1", name: "Prestige Properties Ltd", type: "Estate Agent", email: "info@prestige.co.ke", submitted: "2024-06-20", status: "Pending", docs: 5, docsTotal: 5 },
  { id: "2", name: "Grace Wambui", type: "Landlord", email: "grace.wambui@gmail.com", submitted: "2024-06-19", status: "Under Review", docs: 3, docsTotal: 3 },
  { id: "3", name: "KeyHomes Agency", type: "Estate Agent", email: "admin@keyhomes.co.ke", submitted: "2024-06-18", status: "Info Requested", docs: 4, docsTotal: 5 },
  { id: "4", name: "James Kariuki", type: "Landlord", email: "james.k@gmail.com", submitted: "2024-06-17", status: "Approved", docs: 3, docsTotal: 3 },
  { id: "5", name: "Nairobi Realty Ltd", type: "Estate Agent", email: "info@nairobi-realty.co.ke", submitted: "2024-06-16", status: "Rejected", docs: 3, docsTotal: 5 },
  { id: "6", name: "FastLet Ltd", type: "Estate Agent", email: "admin@fastlet.co.ke", submitted: "2024-06-10", status: "Suspended", docs: 5, docsTotal: 5 },
  { id: "7", name: "Sarah Mutua", type: "Landlord", email: "sarah.m@yahoo.com", submitted: "2024-06-09", status: "Approved", docs: 3, docsTotal: 3 },
  { id: "8", name: "TopFlat Agency", type: "Estate Agent", email: "info@topflat.co.ke", submitted: "2024-06-08", status: "Pending", docs: 5, docsTotal: 5 },
];

const TABS = ["All", "Pending", "Under Review", "Info Requested", "Approved", "Rejected", "Suspended"] as const;

const statusConfig: Record<VerifStatus, { icon: React.ElementType; color: string; bg: string }> = {
  Pending: { icon: Clock, color: "text-amber-700", bg: "bg-amber-100" },
  "Under Review": { icon: ShieldCheck, color: "text-blue-700", bg: "bg-blue-100" },
  "Info Requested": { icon: AlertCircle, color: "text-orange-700", bg: "bg-orange-100" },
  Approved: { icon: CheckCircle2, color: "text-green-700", bg: "bg-green-100" },
  Rejected: { icon: XCircle, color: "text-red-700", bg: "bg-red-100" },
  Suspended: { icon: XCircle, color: "text-red-900", bg: "bg-red-200" },
};

const counts = TABS.reduce((acc, t) => {
  acc[t] = t === "All" ? ITEMS.length : ITEMS.filter((i) => i.status === t).length;
  return acc;
}, {} as Record<string, number>);

export default function AdminVerifications() {
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = ITEMS.filter((i) => {
    if (tab !== "All" && i.status !== tab) return false;
    if (search && !i.name.toLowerCase().includes(search.toLowerCase()) && !i.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl">
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
            onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {t}
            {counts[t] > 0 && (
              <span className={cn("text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                tab === t ? "bg-white/20 text-white" : "bg-muted-foreground/20"
              )}>{counts[t]}</span>
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
              {filtered.map((item) => {
                const sc = statusConfig[item.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs font-medium">{item.name}</td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{item.type}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(item.submitted).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{item.docs}/{item.docsTotal}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit", sc.bg, sc.color)}>
                        <StatusIcon className="h-3 w-3" />{item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                        <Link to={`/admin/verifications/${item.id}`}><Eye className="h-3.5 w-3.5 mr-1" />Review</Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No verifications found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
