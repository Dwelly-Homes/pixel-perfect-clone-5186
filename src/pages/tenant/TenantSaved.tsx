import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, MapPin, Bed, Bath, Search, Calendar, Trash2, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ViewingModal } from "@/components/marketplace/ViewingModal";

interface SavedEntry {
  _id: string;
  savedAt: string;
  property: {
    _id: string;
    title: string;
    neighborhood: string;
    county: string;
    monthlyRent: number;
    propertyType: string;
    status: string;
    images: { url: string; isCover?: boolean }[];
    bedrooms?: number;
    bathrooms?: number;
  };
}

const TYPE_LABEL: Record<string, string> = {
  bedsitter: "Bedsitter",
  studio: "Studio",
  "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom",
  "3_bedroom": "3 Bedroom",
  "4_plus_bedroom": "4+ Bedroom",
  maisonette: "Maisonette",
  bungalow: "Bungalow",
  townhouse: "Townhouse",
  commercial: "Commercial",
};

const BEDS: Record<string, number> = {
  bedsitter: 0, studio: 0, "1_bedroom": 1, "2_bedroom": 2,
  "3_bedroom": 3, "4_plus_bedroom": 4, maisonette: 3, bungalow: 3, townhouse: 3,
};

function coverImage(images: { url: string; isCover?: boolean }[]): string {
  const cover = images.find((i) => i.isCover) ?? images[0];
  return cover?.url || "/placeholder.svg";
}

export default function TenantSaved() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewingProperty, setViewingProperty] = useState<{ id: string; title: string } | null>(null);

  const { data: savedEntries = [], isLoading } = useQuery<SavedEntry[]>({
    queryKey: ["savedProperties"],
    queryFn: async () => {
      const { data } = await api.get("/properties/saved");
      // handle both { data: [...] } and { data: { savedProperties: [...] } }
      const list = data?.data?.savedProperties ?? data?.data ?? [];
      return list as SavedEntry[];
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: (propertyId: string) => api.delete(`/properties/${propertyId}/save`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
      toast({ title: "Removed from saved" });
    },
    onError: (err) => toast({ title: getApiError(err), variant: "destructive" }),
  });

  const filtered = savedEntries
    .filter((entry) => {
      const p = entry.property;
      if (!p) return false;
      const typeLabel = TYPE_LABEL[p.propertyType] ?? p.propertyType;
      if (typeFilter !== "all" && typeLabel !== typeFilter) return false;
      const loc = `${p.neighborhood} ${p.county}`.toLowerCase();
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !loc.includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      if (sortBy === "price-low") return a.property.monthlyRent - b.property.monthlyRent;
      if (sortBy === "price-high") return b.property.monthlyRent - a.property.monthlyRent;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Saved Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "Loading…" : `${savedEntries.length} ${savedEntries.length === 1 ? "property" : "properties"} saved`}
          </p>
        </div>
        <Button asChild className="bg-secondary hover:bg-secondary/90">
          <Link to="/"><Search className="h-4 w-4 mr-2" />Browse More</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search saved properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Apartment">Apartment</SelectItem>
            <SelectItem value="1 Bedroom">1 Bedroom</SelectItem>
            <SelectItem value="2 Bedroom">2 Bedroom</SelectItem>
            <SelectItem value="3 Bedroom">3 Bedroom</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
            <SelectItem value="Bedsitter">Bedsitter</SelectItem>
            <SelectItem value="Maisonette">Maisonette</SelectItem>
            <SelectItem value="Bungalow">Bungalow</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-9 text-sm w-40">
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-heading font-semibold text-lg">
            {savedEntries.length === 0 ? "No saved properties" : "No results match your filters"}
          </p>
          <p className="text-sm text-muted-foreground">
            {savedEntries.length === 0
              ? "Browse properties and tap the heart icon to save them here."
              : "Try adjusting your search or filters."}
          </p>
          {savedEntries.length === 0 && (
            <Button asChild className="bg-secondary hover:bg-secondary/90">
              <Link to="/">Browse Properties</Link>
            </Button>
          )}
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((entry) => {
            const p = entry.property;
            const available = p.status === "available";
            const typeLabel = TYPE_LABEL[p.propertyType] ?? p.propertyType;
            const beds = p.bedrooms ?? BEDS[p.propertyType] ?? 0;
            const baths = p.bathrooms ?? 1;

            return (
              <Card key={entry._id} className={cn("overflow-hidden hover:shadow-md transition-shadow", !available && "opacity-70")}>
                <div className="relative h-44 bg-muted">
                  <img src={coverImage(p.images)} alt={p.title} className="h-full w-full object-cover" />
                  {!available && (
                    <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xs">No Longer Available</Badge>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-card/80 hover:bg-card rounded-full"
                    onClick={() => unsaveMutation.mutate(p._id)}
                    disabled={unsaveMutation.isPending}
                  >
                    <Heart className="h-4 w-4 text-destructive fill-destructive" />
                  </Button>
                  <Badge className="absolute top-2 left-2 bg-card/90 text-foreground text-[10px] border-0">{typeLabel}</Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <p className="font-semibold font-body text-sm truncate">{p.title}</p>
                    <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />{p.neighborhood}, {p.county}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-secondary font-body">
                      KES {p.monthlyRent.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                    </span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {beds > 0 && <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{beds}</span>}
                      <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{baths}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Saved {new Date(entry.savedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  {available && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1 bg-secondary hover:bg-secondary/90 text-xs" asChild>
                        <Link to={`/marketplace/${p._id}`}><Search className="h-3.5 w-3.5 mr-1" />View</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => setViewingProperty({ id: p._id, title: p.title })}
                      >
                        <Calendar className="h-3.5 w-3.5 mr-1" />Book Viewing
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10 px-2"
                        onClick={() => unsaveMutation.mutate(p._id)}
                        disabled={unsaveMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {viewingProperty && (
        <ViewingModal
          open={!!viewingProperty}
          onClose={() => setViewingProperty(null)}
          propertyId={viewingProperty.id}
          propertyTitle={viewingProperty.title}
        />
      )}
    </div>
  );
}
