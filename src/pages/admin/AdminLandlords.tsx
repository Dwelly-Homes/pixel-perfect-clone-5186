import { useState } from "react";
import { Search, Eye, UserX, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type LandlordStatus = "Active" | "Suspended" | "Pending";

interface Landlord {
  id: string;
  name: string;
  email: string;
  phone: string;
  idNumber: string;
  listings: number;
  occupiedListings: number;
  joinedOn: string;
  status: LandlordStatus;
  plan: "Starter" | "Professional";
  totalRevenue: number;
}

const LANDLORDS: Landlord[] = [
  { id: "1", name: "Grace Wambui", email: "grace.w@gmail.com", phone: "+254 712 100 200", idNumber: "12345678", listings: 3, occupiedListings: 3, joinedOn: "2023-01-15", status: "Active", plan: "Starter", totalRevenue: 27000 },
  { id: "2", name: "James Kariuki", email: "james.k@gmail.com", phone: "+254 722 300 400", idNumber: "23456789", listings: 8, occupiedListings: 6, joinedOn: "2022-06-10", status: "Active", plan: "Professional", totalRevenue: 94500 },
  { id: "3", name: "Sarah Mutua", email: "sarah.m@yahoo.com", phone: "+254 733 500 600", idNumber: "34567890", listings: 5, occupiedListings: 4, joinedOn: "2023-03-20", status: "Active", plan: "Starter", totalRevenue: 45000 },
  { id: "4", name: "Peter Njuguna", email: "peter.n@gmail.com", phone: "+254 700 700 800", idNumber: "45678901", listings: 2, occupiedListings: 0, joinedOn: "2024-01-05", status: "Pending", plan: "Starter", totalRevenue: 0 },
  { id: "5", name: "Mary Achieng", email: "mary.a@gmail.com", phone: "+254 711 900 000", idNumber: "56789012", listings: 4, occupiedListings: 2, joinedOn: "2022-11-12", status: "Suspended", plan: "Starter", totalRevenue: 18000 },
  { id: "6", name: "John Kimani", email: "john.k@gmail.com", phone: "+254 723 111 222", idNumber: "67890123", listings: 12, occupiedListings: 10, joinedOn: "2021-09-01", status: "Active", plan: "Professional", totalRevenue: 162000 },
];

const TABS = ["All", "Active", "Suspended", "Pending"] as const;

const statusColors: Record<LandlordStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Suspended: "bg-red-100 text-red-700",
  Pending: "bg-amber-100 text-amber-700",
};

export default function AdminLandlords() {
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = LANDLORDS.filter((l) => {
    if (tab !== "All" && l.status !== tab) return false;
    const q = search.toLowerCase();
    if (q && !l.name.toLowerCase().includes(q) && !l.email.toLowerCase().includes(q)) return false;
    return true;
  });

  const totals = {
    active: LANDLORDS.filter((l) => l.status === "Active").length,
    listings: LANDLORDS.reduce((s, l) => s + l.listings, 0),
    occupied: LANDLORDS.reduce((s, l) => s + l.occupiedListings, 0),
    revenue: LANDLORDS.reduce((s, l) => s + l.totalRevenue, 0),
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Landlords</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage all registered individual landlords on the platform.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Landlords", value: totals.active },
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
          <Input placeholder="Search landlords…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-60" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Landlord", "ID Number", "Plan", "Listings", "Occupancy", "Revenue", "Joined", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground">{l.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{l.idNumber}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", l.plan === "Professional" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600")}>{l.plan}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-center">{l.listings}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-medium">{l.listings > 0 ? Math.round((l.occupiedListings / l.listings) * 100) : 0}%</span>
                    <span className="text-muted-foreground ml-1">({l.occupiedListings}/{l.listings})</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">KES {l.totalRevenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(l.joinedOn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[l.status])}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link to={`/admin/landlords/${l.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      {l.status === "Active" ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50" onClick={() => toast({ title: "Landlord suspended", description: l.name })}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      ) : l.status === "Suspended" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:bg-green-50" onClick={() => toast({ title: "Landlord reinstated", description: l.name })}>
                          <UserCheck className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No landlords found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
