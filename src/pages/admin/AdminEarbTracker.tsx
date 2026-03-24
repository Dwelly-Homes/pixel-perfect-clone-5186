import { useState } from "react";
import { Search, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EarbAgent {
  id: string;
  name: string;
  email: string;
  phone: string;
  earbNumber: string;
  expiryDate: string;
  lastRenewed: string;
  listingsCount: number;
}

const AGENTS: EarbAgent[] = [
  { id: "1", name: "Prestige Properties Ltd", email: "info@prestige.co.ke", phone: "+254 712 345 678", earbNumber: "EARB/2021/0042", expiryDate: "2024-07-15", lastRenewed: "2023-07-15", listingsCount: 12 },
  { id: "2", name: "KeyHomes Agency", email: "admin@keyhomes.co.ke", phone: "+254 722 456 789", earbNumber: "EARB/2020/0117", expiryDate: "2024-06-30", lastRenewed: "2023-06-30", listingsCount: 8 },
  { id: "3", name: "Nairobi Realty Ltd", email: "info@nairobi-realty.co.ke", phone: "+254 733 567 890", earbNumber: "EARB/2019/0203", expiryDate: "2024-08-01", lastRenewed: "2023-08-01", listingsCount: 22 },
  { id: "4", name: "TopFlat Agency", email: "info@topflat.co.ke", phone: "+254 700 678 901", earbNumber: "EARB/2022/0055", expiryDate: "2024-05-31", lastRenewed: "2023-05-31", listingsCount: 5 },
  { id: "5", name: "FastLet Ltd", email: "admin@fastlet.co.ke", phone: "+254 711 789 012", earbNumber: "EARB/2021/0089", expiryDate: "2024-04-15", lastRenewed: "2023-04-15", listingsCount: 0 },
  { id: "6", name: "Homes Kenya Ltd", email: "info@homeskenya.co.ke", phone: "+254 723 890 123", earbNumber: "EARB/2020/0156", expiryDate: "2024-12-31", lastRenewed: "2023-12-31", listingsCount: 18 },
  { id: "7", name: "PrimeSpace Agency", email: "admin@primespace.co.ke", phone: "+254 700 901 234", earbNumber: "EARB/2022/0071", expiryDate: "2024-11-30", lastRenewed: "2023-11-30", listingsCount: 9 },
];

const TODAY = new Date("2024-06-21");

function getDaysUntilExpiry(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - TODAY.getTime()) / 86400000);
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
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const withDays = AGENTS.map((a) => ({ ...a, days: getDaysUntilExpiry(a.expiryDate) }));

  const filtered = withDays.filter((a) => {
    if (tab === "Expired" && a.days >= 0) return false;
    if (tab === "Expiring Soon" && (a.days < 0 || a.days > 30)) return false;
    if (tab === "Valid" && a.days <= 30) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.earbNumber.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const expired = withDays.filter((a) => a.days < 0).length;
  const expiringSoon = withDays.filter((a) => a.days >= 0 && a.days <= 30).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">EARB Tracker</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor Estate Agents Registration Board certificate expiry dates.</p>
      </div>

      {/* Summary */}
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

      {/* Filters */}
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
                {["Agency", "EARB Number", "Email", "Expiry Date", "Status", "Listings", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const es = getExpiryStatus(a.days);
                const StatusIcon = es.icon;
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{a.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{a.earbNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{a.email}</td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {new Date(a.expiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit", es.bg, es.color)}>
                        <StatusIcon className="h-3 w-3" />{es.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">{a.listingsCount}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast({ title: "Reminder sent", description: `Renewal reminder sent to ${a.name}` })}>
                        <RefreshCw className="h-3 w-3 mr-1" />Send Reminder
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No agents found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
