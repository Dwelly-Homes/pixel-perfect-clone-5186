import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { transformProperty } from "@/lib/propertyTransform";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=60";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  available:         { label: "Available", variant: "default" },
  occupied:          { label: "Occupied", variant: "secondary" },
  under_maintenance: { label: "Maintenance", variant: "destructive" },
  draft:             { label: "Draft", variant: "outline" },
  expired:           { label: "Expired", variant: "destructive" },
  hidden:            { label: "Hidden", variant: "outline" },
};

export default function PropertyList() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"monthlyRent" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data, isLoading } = useQuery({
    queryKey: ["myProperties", search, statusFilter, sortField, sortDir],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("sort", sortField);
      params.set("order", sortDir);
      params.set("limit", "50");
      const { data } = await api.get(`/properties?${params.toString()}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (id: string) => api.delete(`/properties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
      toast.success("Property deleted successfully");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const rawProperties = data?.data || [];

  const toggleSort = (field: "monthlyRent" | "createdAt") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDelete = (property: any) => {
    if (!window.confirm(`Delete "${property.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(property._id);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">My Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data?.pagination?.total ?? 0} properties listed
          </p>
        </div>
        <Button asChild className="bg-secondary hover:bg-orange-dark text-secondary-foreground">
          <Link to="/dashboard/properties/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="occupied">Occupied</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="under_maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Property</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("monthlyRent")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Price <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("createdAt")}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  Listed <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-12 bg-muted rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : rawProperties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No properties found.{" "}
                  <Link to="/dashboard/properties/new" className="text-secondary hover:underline">
                    Add your first property
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rawProperties.map((rawProp: any) => {
                const property = transformProperty(rawProp);
                const coverImg = rawProp.images?.find((i: { isCover: boolean }) => i.isCover)?.url
                  || rawProp.images?.[0]?.url
                  || PLACEHOLDER_IMAGE;
                const cfg = statusConfig[rawProp.status] ?? { label: rawProp.status, variant: "outline" as const };
                return (
                  <TableRow key={rawProp._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={coverImg}
                          alt={property.title}
                          className="h-12 w-16 rounded-md object-cover shrink-0 bg-muted"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{property.title}</p>
                          <p className="text-xs text-muted-foreground">{property.type} · {property.bedrooms > 0 ? `${property.bedrooms} bed` : "Studio"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {property.location.neighborhood}, {property.location.county}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      KES {property.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(rawProp.createdAt).toLocaleDateString("en-KE", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/marketplace/${rawProp._id}`}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to={`/dashboard/properties/${rawProp._id}/edit`}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(rawProp)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
