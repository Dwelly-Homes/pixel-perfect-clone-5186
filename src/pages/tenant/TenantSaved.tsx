import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, MapPin, Bed, Bath, Search, Calendar, MessageSquare, Trash2, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SavedProperty {
  id: number;
  title: string;
  location: string;
  area: string;
  price: number;
  beds: number;
  baths: number;
  type: string;
  image: string;
  savedOn: string;
  available: boolean;
}

const SAVED: SavedProperty[] = [
  { id: 1, title: "Modern 2BR Apartment", location: "Kilimani, Nairobi", area: "Kilimani", price: 65000, beds: 2, baths: 2, type: "Apartment", image: "/placeholder.svg", savedOn: "2024-06-18", available: true },
  { id: 2, title: "Spacious Studio", location: "Westlands, Nairobi", area: "Westlands", price: 35000, beds: 1, baths: 1, type: "Studio", image: "/placeholder.svg", savedOn: "2024-06-17", available: true },
  { id: 3, title: "3BR Garden Villa", location: "Karen, Nairobi", area: "Karen", price: 120000, beds: 3, baths: 3, type: "House", image: "/placeholder.svg", savedOn: "2024-06-15", available: false },
  { id: 4, title: "1BR Cozy Flat", location: "Lavington, Nairobi", area: "Lavington", price: 40000, beds: 1, baths: 1, type: "Apartment", image: "/placeholder.svg", savedOn: "2024-06-12", available: true },
  { id: 5, title: "Luxury Penthouse", location: "Upperhill, Nairobi", area: "Upperhill", price: 250000, beds: 4, baths: 4, type: "Apartment", image: "/placeholder.svg", savedOn: "2024-06-10", available: true },
  { id: 6, title: "2BR Family Home", location: "Runda, Nairobi", area: "Runda", price: 90000, beds: 2, baths: 2, type: "House", image: "/placeholder.svg", savedOn: "2024-06-08", available: true },
];

export default function TenantSaved() {
  const { toast } = useToast();
  const [saved, setSaved] = useState(SAVED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [typeFilter, setTypeFilter] = useState("all");

  function unsave(id: number) {
    setSaved((prev) => prev.filter((p) => p.id !== id));
    toast({ title: "Removed from saved" });
  }

  const filtered = saved
    .filter((p) => {
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.area.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.savedOn).getTime() - new Date(a.savedOn).getTime();
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return 0;
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold">Saved Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">{saved.length} properties saved</p>
        </div>
        <Button asChild className="bg-secondary hover:bg-secondary/90">
          <Link to="/"><Search className="h-4 w-4 mr-2" />Browse More</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search saved properties…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9 text-sm" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 text-sm w-36"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Apartment">Apartment</SelectItem>
            <SelectItem value="House">House</SelectItem>
            <SelectItem value="Studio">Studio</SelectItem>
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

      {filtered.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="font-heading font-semibold text-lg">No saved properties</p>
          <p className="text-sm text-muted-foreground">Browse properties and tap the heart icon to save them here.</p>
          <Button asChild className="bg-secondary hover:bg-secondary/90">
            <Link to="/">Browse Properties</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <Card key={p.id} className={cn("overflow-hidden hover:shadow-md transition-shadow", !p.available && "opacity-70")}>
              <div className="relative h-44 bg-muted">
                <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                {!p.available && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <Badge variant="destructive" className="text-xs">No Longer Available</Badge>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 bg-card/80 hover:bg-card rounded-full"
                  onClick={() => unsave(p.id)}
                >
                  <Heart className="h-4 w-4 text-destructive fill-destructive" />
                </Button>
                <Badge className="absolute top-2 left-2 bg-card/90 text-foreground text-[10px] border-0">{p.type}</Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="font-semibold font-body text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" />{p.location}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-secondary font-body">KES {p.price.toLocaleString()}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" />{p.beds}</span>
                    <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" />{p.baths}</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Saved {new Date(p.savedOn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</p>
                {p.available && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" className="flex-1 bg-secondary hover:bg-secondary/90 text-xs" asChild>
                      <Link to={`/marketplace/${p.id}`}><Search className="h-3.5 w-3.5 mr-1" />View</Link>
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs">
                      <Calendar className="h-3.5 w-3.5 mr-1" />Book Viewing
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 px-2" onClick={() => unsave(p.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
