import { useState } from "react";
import { Search, Eye, UserCheck, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TenantStatus = "Active" | "Inactive" | "Flagged";

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property: string;
  agent: string;
  moveIn: string;
  status: TenantStatus;
  rent: number;
}

const TENANTS: Tenant[] = [
  { id: "1", name: "Grace Akinyi", email: "grace.a@gmail.com", phone: "+254 712 111 222", property: "Modern 2BR in Kilimani", agent: "Prestige Properties Ltd", moveIn: "2024-06-01", status: "Active", rent: 55000 },
  { id: "2", name: "David Kamau", email: "david.k@yahoo.com", phone: "+254 722 333 444", property: "Elegant 1BR in Lavington", agent: "KeyHomes Agency", moveIn: "2024-05-15", status: "Active", rent: 40000 },
  { id: "3", name: "Sarah Njeri", email: "sarah.n@gmail.com", phone: "+254 733 555 666", property: "Cozy Studio in Westlands", agent: "Prestige Properties Ltd", moveIn: "2024-04-01", status: "Inactive", rent: 25000 },
  { id: "4", name: "Peter Odhiambo", email: "peter.o@gmail.com", phone: "+254 700 777 888", property: "Spacious 3BR in Runda", agent: "Nairobi Realty Ltd", moveIn: "2024-06-10", status: "Active", rent: 120000 },
  { id: "5", name: "Amina Hassan", email: "amina.h@gmail.com", phone: "+254 711 999 000", property: "Modern 2BR in Kilimani", agent: "Prestige Properties Ltd", moveIn: "2024-03-01", status: "Flagged", rent: 55000 },
  { id: "6", name: "James Mwangi", email: "james.m@gmail.com", phone: "+254 723 123 456", property: "Studio in Ngong Road", agent: "FastLet Ltd", moveIn: "2024-02-15", status: "Inactive", rent: 18000 },
  { id: "7", name: "Lucy Wanjiku", email: "lucy.w@gmail.com", phone: "+254 700 234 567", property: "2BR in Parklands", agent: "KeyHomes Agency", moveIn: "2024-01-01", status: "Active", rent: 45000 },
];

const statusColors: Record<TenantStatus, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Flagged: "bg-red-100 text-red-700",
};

const TABS = ["All", "Active", "Inactive", "Flagged"] as const;

export default function AdminTenants() {
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = TENANTS.filter((t) => {
    if (tab !== "All" && t.status !== tab) return false;
    const q = search.toLowerCase();
    if (q && !t.name.toLowerCase().includes(q) && !t.email.toLowerCase().includes(q) && !t.property.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Tenants</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage all platform tenants.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
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
          <Input placeholder="Search tenants…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-64" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Name", "Email", "Phone", "Property", "Agent", "Move-in", "Rent", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.email}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{t.phone}</td>
                  <td className="px-4 py-3 text-xs max-w-[140px] truncate">{t.property}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate">{t.agent}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(t.moveIn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">KES {t.rent.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[t.status])}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link to={`/admin/tenants/${t.id}`}><Eye className="h-3.5 w-3.5" /></Link>
                      </Button>
                      {t.status === "Flagged" ? (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => toast({ title: "Tenant reinstated", description: t.name })}>
                          <UserCheck className="h-3.5 w-3.5" />
                        </Button>
                      ) : t.status === "Active" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700" onClick={() => toast({ title: "Tenant flagged", description: t.name })}>
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No tenants found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
