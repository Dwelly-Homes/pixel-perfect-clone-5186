import { useState } from "react";
import { Search, MapPin, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type PropStatus = "Occupied" | "Available" | "Inactive";

interface Property {
  id: string;
  title: string;
  area: string;
  type: "Apartment" | "House" | "Studio" | "Commercial";
  beds: number;
  rent: number;
  status: PropStatus;
  owner: string;
  ownerType: "Agent" | "Landlord";
  tenant?: string;
  listedOn: string;
}

const PROPERTIES: Property[] = [
  { id: "1", title: "Modern 2BR in Kilimani", area: "Kilimani", type: "Apartment", beds: 2, rent: 55000, status: "Occupied", owner: "Prestige Properties", ownerType: "Agent", tenant: "Grace Akinyi", listedOn: "2024-01-10" },
  { id: "2", title: "Elegant 1BR in Lavington", area: "Lavington", type: "Apartment", beds: 1, rent: 40000, status: "Occupied", owner: "KeyHomes Agency", ownerType: "Agent", tenant: "David Kamau", listedOn: "2024-02-01" },
  { id: "3", title: "Spacious 3BR in Runda", area: "Runda", type: "House", beds: 3, rent: 120000, status: "Occupied", owner: "Nairobi Realty Ltd", ownerType: "Agent", tenant: "Peter Odhiambo", listedOn: "2024-01-20" },
  { id: "4", title: "Cozy Studio in Westlands", area: "Westlands", type: "Studio", beds: 0, rent: 25000, status: "Available", owner: "Prestige Properties", ownerType: "Agent", listedOn: "2024-03-05" },
  { id: "5", title: "2BR in Parklands", area: "Parklands", type: "Apartment", beds: 2, rent: 45000, status: "Occupied", owner: "James Kariuki", ownerType: "Landlord", tenant: "Lucy Wanjiku", listedOn: "2023-12-01" },
  { id: "6", title: "1BR in South B", area: "South B", type: "Apartment", beds: 1, rent: 22000, status: "Occupied", owner: "James Kariuki", ownerType: "Landlord", tenant: "Eric Mutai", listedOn: "2024-01-15" },
  { id: "7", title: "4BR in Karen", area: "Karen", type: "House", beds: 4, rent: 180000, status: "Available", owner: "Nairobi Realty Ltd", ownerType: "Agent", listedOn: "2024-04-10" },
  { id: "8", title: "Studio in Ngong Road", area: "Ngong Road", type: "Studio", beds: 0, rent: 15000, status: "Available", owner: "John Kimani", ownerType: "Landlord", listedOn: "2024-05-01" },
  { id: "9", title: "3BR in Langata", area: "Langata", type: "House", beds: 3, rent: 80000, status: "Occupied", owner: "James Kariuki", ownerType: "Landlord", tenant: "Mercy Wanjiru", listedOn: "2024-02-20" },
  { id: "10", title: "2BR Apartment in Westlands", area: "Westlands", type: "Apartment", beds: 2, rent: 60000, status: "Occupied", owner: "Homes Kenya Ltd", ownerType: "Agent", tenant: "Anne Waweru", listedOn: "2024-01-05" },
  { id: "11", title: "Office Space in Upper Hill", area: "Upper Hill", type: "Commercial", beds: 0, rent: 200000, status: "Inactive", owner: "Nairobi Realty Ltd", ownerType: "Agent", listedOn: "2023-11-01" },
  { id: "12", title: "1BR in Ruaka", area: "Ruaka", type: "Apartment", beds: 1, rent: 18000, status: "Occupied", owner: "John Kimani", ownerType: "Landlord", tenant: "Faith Njeri", listedOn: "2024-04-01" },
];

const statusColors: Record<PropStatus, string> = {
  Occupied: "bg-green-100 text-green-700",
  Available: "bg-blue-100 text-blue-700",
  Inactive: "bg-gray-100 text-gray-600",
};

const AREAS = [...new Set(PROPERTIES.map((p) => p.area))].sort();

export default function AdminProperties() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");

  const filtered = PROPERTIES.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (typeFilter !== "all" && p.type !== typeFilter) return false;
    if (ownerFilter !== "all" && p.ownerType !== ownerFilter) return false;
    const q = search.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q) && !p.area.toLowerCase().includes(q) && !p.owner.toLowerCase().includes(q)) return false;
    return true;
  });

  const occupied = PROPERTIES.filter((p) => p.status === "Occupied").length;
  const available = PROPERTIES.filter((p) => p.status === "Available").length;
  const occupancyRate = Math.round((occupied / PROPERTIES.length) * 100);
  const totalRentRoll = PROPERTIES.filter((p) => p.status === "Occupied").reduce((s, p) => s + p.rent, 0);

  // Area breakdown
  const areaStats = AREAS.map((area) => {
    const areaProps = PROPERTIES.filter((p) => p.area === area);
    const areaOccupied = areaProps.filter((p) => p.status === "Occupied").length;
    return { area, total: areaProps.length, occupied: areaOccupied };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">All Properties</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide property inventory, occupancy, and rent roll.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Listings", value: PROPERTIES.length },
          { label: "Occupied", value: occupied, sub: `${occupancyRate}% occupancy rate` },
          { label: "Available", value: available },
          { label: "Monthly Rent Roll", value: `KES ${totalRentRoll.toLocaleString()}` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-xl font-heading font-bold mt-0.5">{s.value}</p>
              {s.sub && <p className="text-[10px] text-muted-foreground">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Occupancy by area */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" />Occupancy by Area (top 5)</p>
          <div className="space-y-2.5">
            {areaStats.map((a) => (
              <div key={a.area}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{a.area}</span>
                  <span className="text-muted-foreground">{a.occupied}/{a.total} occupied ({a.total > 0 ? Math.round((a.occupied / a.total) * 100) : 0}%)</span>
                </div>
                <Progress value={a.total > 0 ? (a.occupied / a.total) * 100 : 0} className="h-1.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search properties…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-56" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Occupied">Occupied</SelectItem>
            <SelectItem value="Available">Available</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Property type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Apartment">Apartment</SelectItem>
            <SelectItem value="House">House</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
            <SelectItem value="Commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Owner type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            <SelectItem value="Agent">Agent</SelectItem>
            <SelectItem value="Landlord">Landlord</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} properties</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Property", "Area", "Type", "Beds", "Rent/mo", "Owner", "Status", "Tenant", "Listed"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs font-medium max-w-[160px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                    <MapPin className="h-3 w-3 shrink-0" />{p.area}
                  </td>
                  <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{p.type}</span></td>
                  <td className="px-4 py-3 text-xs text-center text-muted-foreground">{p.beds > 0 ? p.beds : "—"}</td>
                  <td className="px-4 py-3 text-xs font-medium">KES {p.rent.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium">{p.owner}</p>
                    <p className="text-[10px] text-muted-foreground">{p.ownerType}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[p.status])}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.tenant || "—"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(p.listedOn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No properties found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
