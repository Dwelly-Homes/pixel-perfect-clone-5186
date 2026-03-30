import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, PieChart as PieChartIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const LIMIT = 15;

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

const AREA_CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--info))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
];

type AreaStat = {
  area: string;
  total: number;
  occupied: number;
};

type AreaSlice = AreaStat & {
  value: number;
  fill: string;
  occupancyRate: number;
};

function AreaOccupancyTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: AreaSlice }>;
}) {
  if (!active || !payload?.length) return null;

  const slice = payload[0]?.payload;
  if (!slice) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold">{slice.area}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {slice.occupied} occupied of {slice.total} total
      </p>
      <p className="text-[11px] text-muted-foreground">
        {slice.occupancyRate}% occupancy
      </p>
    </div>
  );
}

export default function AdminProperties() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["adminProperties", search, statusFilter, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(LIMIT), page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (typeFilter !== "all") params.set("propertyType", typeFilter);
      const { data } = await api.get(`/properties/marketplace?${params.toString()}`);
      return data;
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any[] = data?.data || [];
  const total: number = data?.meta?.total ?? 0;
  const totalPages: number = data?.meta?.totalPages ?? 1;

  const occupied = properties.filter((p) => p.status === "occupied").length;
  const available = properties.filter((p) => p.status === "available").length;
  const occupancyRate = properties.length > 0 ? Math.round((occupied / properties.length) * 100) : 0;
  const totalRentRoll = properties.filter((p) => p.status === "occupied").reduce((s: number, p: { monthlyRent?: number }) => s + (p.monthlyRent || 0), 0);

  // Area breakdown from current page data
  const areaMap: Record<string, AreaStat> = {};
  properties.forEach((p) => {
    const area = p.neighborhood || p.county || "Other";
    if (!areaMap[area]) areaMap[area] = { area, total: 0, occupied: 0 };
    areaMap[area].total++;
    if (p.status === "occupied") areaMap[area].occupied++;
  });
  const areaStats = Object.entries(areaMap)
    .map(([area, s]) => ({ area, ...s }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const totalAreaUnits = areaStats.reduce((sum, area) => sum + area.total, 0);
  const totalAreaOccupied = areaStats.reduce((sum, area) => sum + area.occupied, 0);
  const areaColorMap = new Map(
    areaStats.map((area, index) => [area.area, AREA_CHART_COLORS[index % AREA_CHART_COLORS.length]])
  );
  const areaChartData: AreaSlice[] = areaStats.map((area) => ({
    ...area,
    value: area.occupied,
    fill: areaColorMap.get(area.area) || AREA_CHART_COLORS[0],
    occupancyRate: area.total > 0 ? Math.round((area.occupied / area.total) * 100) : 0,
  }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">All Properties</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide property inventory, occupancy, and rent roll.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Listings", value: total },
          { label: "Occupied (this page)", value: occupied, sub: `${occupancyRate}% of current page` },
          { label: "Available (this page)", value: available },
          { label: "Rent Roll (this page)", value: `KES ${totalRentRoll.toLocaleString()}` },
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
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                Occupancy by Area (current page)
              </p>
              <p className="text-xs text-muted-foreground">
                Donut slices reflect occupied units across the top 5 areas on this page.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,300px)_1fr] md:items-center">
              <div className="relative mx-auto h-64 w-full max-w-[320px]">
                {areaChartData.some((entry) => entry.value > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<AreaOccupancyTooltip />} />
                        <Pie
                          data={areaChartData.filter((entry) => entry.value > 0)}
                          dataKey="value"
                          nameKey="area"
                          innerRadius={72}
                          outerRadius={102}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {areaChartData
                            .filter((entry) => entry.value > 0)
                            .map((entry) => (
                              <Cell key={entry.area} fill={entry.fill} />
                            ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                      <p className="text-3xl font-heading font-bold">{totalAreaOccupied}</p>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">occupied units</p>
                      <p className="mt-1 text-xs text-muted-foreground">{totalAreaUnits} total listings</p>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-muted/30 px-4 text-center text-sm text-muted-foreground">
                    No occupied units on this page yet.
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {areaStats.map((a) => {
                  const color = areaColorMap.get(a.area) || AREA_CHART_COLORS[0];
                  const rate = a.total > 0 ? Math.round((a.occupied / a.total) * 100) : 0;

                  return (
                    <div key={a.area} className="flex items-start gap-3 rounded-xl border bg-muted/30 px-3 py-2">
                      <span className="mt-1.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium">{a.area}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {a.occupied}/{a.total}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{rate}% occupied</span>
                          <span>{a.total} listings</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search properties…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-8 h-8 text-xs w-56"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="under_maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
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
        <span className="text-xs text-muted-foreground ml-auto">{properties.length} shown of {total}</span>
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-xs text-muted-foreground">
              <span>{total} total · Page {page} of {totalPages}</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="px-2">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
