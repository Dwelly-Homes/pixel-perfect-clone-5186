import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

const statusColors: Record<string, string> = {
  available: "bg-blue-100 text-blue-700",
  occupied: "bg-green-100 text-green-700",
  draft: "bg-gray-100 text-gray-600",
  under_maintenance: "bg-orange-100 text-orange-700",
  expired: "bg-red-100 text-red-600",
  hidden: "bg-gray-100 text-gray-600",
};

const statusLabels: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  draft: "Draft",
  under_maintenance: "Maintenance",
  expired: "Expired",
  hidden: "Hidden",
};

const TYPE_LABEL: Record<string, string> = {
  bedsitter: "Bedsitter",
  studio: "Studio",
  "1_bedroom": "1BR",
  "2_bedroom": "2BR",
  "3_bedroom": "3BR",
  "4_plus_bedroom": "4BR+",
  maisonette: "Maisonette",
  bungalow: "Bungalow",
  townhouse: "Townhouse",
  commercial: "Commercial",
};

export default function AdminProperties() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["adminProperties", search, statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("propertyType", typeFilter);
      const { data } = await api.get(`/properties/marketplace?${params.toString()}`);
      return data;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any[] = data?.data || [];
  const total = data?.pagination?.total ?? 0;

  const occupied = properties.filter((p) => p.status === "occupied").length;
  const available = properties.filter((p) => p.status === "available").length;
  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const totalRentRoll = properties.filter((p) => p.status === "occupied").reduce((s: number, p: { monthlyRent?: number }) => s + (p.monthlyRent || 0), 0);

  // Area breakdown
  const areaMap: Record<string, { total: number; occupied: number }> = {};
  properties.forEach((p) => {
    const area = p.neighborhood || p.county || "Other";
    if (!areaMap[area]) areaMap[area] = { total: 0, occupied: 0 };
    areaMap[area].total++;
    if (p.status === "occupied") areaMap[area].occupied++;
  });
  const areaStats = Object.entries(areaMap)
    .map(([area, s]) => ({ area, ...s }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">All Properties</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide property inventory, occupancy, and rent roll.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Listings", value: total },
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

      {areaStats.length > 0 && (
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
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search properties…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-56" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="under_maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Property type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="studio">Studio</SelectItem>
            <SelectItem value="bedsitter">Bedsitter</SelectItem>
            <SelectItem value="1_bedroom">1 Bedroom</SelectItem>
            <SelectItem value="2_bedroom">2 Bedroom</SelectItem>
            <SelectItem value="3_bedroom">3 Bedroom</SelectItem>
            <SelectItem value="4_plus_bedroom">4+ Bedroom</SelectItem>
            <SelectItem value="maisonette">Maisonette</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{properties.length} properties shown</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Property", "Area", "Type", "Rent/mo", "Owner", "Status", "Listed"].map((h) => (
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
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-muted-foreground">No properties found.</td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                properties.map((p: any) => {
                  const tenant = typeof p.tenantId === "object" ? p.tenantId : null;
                  return (
                    <tr key={p._id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium max-w-[160px] truncate">{p.title}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 whitespace-nowrap"><MapPin className="h-3 w-3 shrink-0" />{p.neighborhood || p.county}</span>
                      </td>
                      <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{TYPE_LABEL[p.propertyType] || p.propertyType}</span></td>
                      <td className="px-4 py-3 text-xs font-medium">KES {p.monthlyRent?.toLocaleString() || "—"}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium">{tenant?.businessName || "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{tenant?.accountType?.replace("_", " ") || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[p.status] || "bg-gray-100 text-gray-600")}>
                          {statusLabels[p.status] || p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
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
