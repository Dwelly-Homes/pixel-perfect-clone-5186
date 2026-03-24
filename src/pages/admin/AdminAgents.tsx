import { useState } from "react";
import { Search, Eye, UserCheck, UserX, BadgeCheck, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type AgentStatus = "Active" | "Suspended" | "Pending" | "Rejected";

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  earbNumber: string;
  earbExpiry: string;
  plan: "Starter" | "Professional" | "Enterprise";
  listings: number;
  occupiedListings: number;
  agents: number;
  joinedOn: string;
  status: AgentStatus;
  totalRevenue: number;
}

const AGENTS: Agent[] = [
  { id: "1", name: "Prestige Properties Ltd", email: "info@prestige.co.ke", phone: "+254 712 345 678", earbNumber: "EARB/2021/0042", earbExpiry: "2024-07-15", plan: "Professional", listings: 24, occupiedListings: 18, agents: 7, joinedOn: "2021-03-15", status: "Active", totalRevenue: 162000 },
  { id: "2", name: "KeyHomes Agency", email: "admin@keyhomes.co.ke", phone: "+254 722 456 789", earbNumber: "EARB/2020/0117", earbExpiry: "2024-06-30", plan: "Professional", listings: 12, occupiedListings: 9, agents: 4, joinedOn: "2022-01-10", status: "Active", totalRevenue: 81000 },
  { id: "3", name: "Nairobi Realty Ltd", email: "info@nairobi-realty.co.ke", phone: "+254 733 567 890", earbNumber: "EARB/2019/0203", earbExpiry: "2024-08-01", plan: "Enterprise", listings: 68, occupiedListings: 55, agents: 22, joinedOn: "2019-06-01", status: "Active", totalRevenue: 540000 },
  { id: "4", name: "TopFlat Agency", email: "info@topflat.co.ke", phone: "+254 700 678 901", earbNumber: "EARB/2022/0055", earbExpiry: "2024-05-31", plan: "Starter", listings: 5, occupiedListings: 2, agents: 1, joinedOn: "2022-08-20", status: "Suspended", totalRevenue: 9000 },
  { id: "5", name: "FastLet Ltd", email: "admin@fastlet.co.ke", phone: "+254 711 789 012", earbNumber: "EARB/2021/0089", earbExpiry: "2024-04-15", plan: "Starter", listings: 0, occupiedListings: 0, agents: 2, joinedOn: "2021-11-05", status: "Suspended", totalRevenue: 7500 },
  { id: "6", name: "Homes Kenya Ltd", email: "info@homeskenya.co.ke", phone: "+254 723 890 123", earbNumber: "EARB/2020/0156", earbExpiry: "2024-12-31", plan: "Professional", listings: 18, occupiedListings: 14, agents: 6, joinedOn: "2020-09-15", status: "Active", totalRevenue: 126000 },
  { id: "7", name: "PrimeSpace Agency", email: "admin@primespace.co.ke", phone: "+254 700 901 234", earbNumber: "EARB/2022/0071", earbExpiry: "2024-11-30", plan: "Starter", listings: 6, occupiedListings: 4, agents: 2, joinedOn: "2023-02-01", status: "Pending", totalRevenue: 0 },
];

const TABS = ["All", "Active", "Suspended", "Pending"] as const;

const statusColors: Record<AgentStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Suspended: "bg-red-100 text-red-700",
  Pending: "bg-amber-100 text-amber-700",
  Rejected: "bg-gray-100 text-gray-600",
};

const planColors: Record<string, string> = {
  Starter: "bg-gray-100 text-gray-600",
  Professional: "bg-blue-100 text-blue-700",
  Enterprise: "bg-purple-100 text-purple-700",
};

const TODAY = new Date("2024-06-21");

export default function AdminAgents() {
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = AGENTS.filter((a) => {
    if (tab !== "All" && a.status !== tab) return false;
    const q = search.toLowerCase();
    if (q && !a.name.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    return true;
  });

  const totals = {
    active: AGENTS.filter((a) => a.status === "Active").length,
    listings: AGENTS.reduce((s, a) => s + a.listings, 0),
    occupied: AGENTS.reduce((s, a) => s + a.occupiedListings, 0),
    revenue: AGENTS.reduce((s, a) => s + a.totalRevenue, 0),
  };

  function toggleSuspend(agent: Agent) {
    const action = agent.status === "Active" ? "suspended" : "reinstated";
    toast({ title: `Agent ${action}`, description: agent.name });
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Agents & Agencies</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all registered estate agents on the platform.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Agencies", value: totals.active },
          { label: "Total Listings", value: totals.listings },
          { label: "Occupied", value: `${totals.occupied} / ${totals.listings}` },
          { label: "Total Revenue", value: `KES ${totals.revenue.toLocaleString()}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-heading font-bold mt-0.5">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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
          <Input placeholder="Search agents…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-60" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Agency", "Plan", "Listings", "Occupancy", "Team", "EARB Expiry", "Revenue", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const daysLeft = Math.ceil((new Date(a.earbExpiry).getTime() - TODAY.getTime()) / 86400000);
                const earbWarning = daysLeft < 0 || daysLeft <= 30;
                return (
                  <tr key={a.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium">{a.name}</p>
                      <p className="text-[10px] text-muted-foreground">{a.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", planColors[a.plan])}>{a.plan}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">{a.listings}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <span className="font-medium">{a.listings > 0 ? Math.round((a.occupiedListings / a.listings) * 100) : 0}%</span>
                        <span className="text-muted-foreground ml-1">({a.occupiedListings}/{a.listings})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-center">{a.agents}</td>
                    <td className="px-4 py-3">
                      <div className={cn("flex items-center gap-1 text-xs", earbWarning ? "text-red-600" : "text-muted-foreground")}>
                        {earbWarning && <AlertTriangle className="h-3 w-3 shrink-0" />}
                        {new Date(a.earbExpiry).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium">KES {a.totalRevenue.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[a.status])}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                          <Link to={`/admin/agents/${a.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                        </Button>
                        {a.status === "Active" ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => toggleSuspend(a)}>
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        ) : a.status === "Suspended" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => toggleSuspend(a)}>
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
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
