import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { MarketplaceNav } from "@/components/marketplace/MarketplaceNav";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { PropertyCard } from "@/components/marketplace/PropertyCard";
import { Footer } from "@/components/marketplace/Footer";
import { PRICE_RANGES } from "@/data/properties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { transformProperty } from "@/lib/propertyTransform";

const ITEMS_PER_PAGE = 9;

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCounty, setSelectedCounty] = useState("all");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("0");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [bedroomFilter, setBedroomFilter] = useState("Any");
  const [priceSlider, setPriceSlider] = useState<[number, number]>([0, 500000]);
  const [page, setPage] = useState(1);

  // Map frontend type labels to backend propertyType values
  const typeToBackend: Record<string, string> = {
    "Bedsitter": "bedsitter",
    "Studio": "studio",
    "1 Bedroom": "1_bedroom",
    "2 Bedroom": "2_bedroom",
    "3 Bedroom": "3_bedroom",
    "4+ Bedroom": "4_plus_bedroom",
    "Maisonette": "maisonette",
    "Bungalow": "bungalow",
    "Townhouse": "townhouse",
  };

  const priceRangeIdx = parseInt(selectedPriceRange);
  const priceRange = priceRangeIdx > 0 ? PRICE_RANGES[priceRangeIdx] : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["marketplace", searchQuery, selectedCounty, selectedType, priceRangeIdx, priceSlider, sortBy, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCounty !== "all") params.set("county", selectedCounty);
      if (selectedType !== "All" && typeToBackend[selectedType]) params.set("propertyType", typeToBackend[selectedType]);
      const minPrice = priceRange ? priceRange.min : priceSlider[0];
      const maxPrice = priceRange ? (priceRange.max === Infinity ? priceSlider[1] : Math.min(priceRange.max, priceSlider[1])) : priceSlider[1];
      if (minPrice > 0) params.set("minPrice", String(minPrice));
      if (maxPrice < 500000) params.set("maxPrice", String(maxPrice));
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(page));
      const { data } = await api.get(`/properties/marketplace?${params.toString()}`);
      return data;
    },
    placeholderData: (prev) => prev,
  });

  const clearAll = () => {
    setSelectedAmenities([]);
    setBedroomFilter("Any");
    setPriceSlider([0, 500000]);
    setSearchQuery("");
    setSelectedCounty("all");
    setSelectedType("All");
    setSelectedPriceRange("0");
    setPage(1);
  };

  const rawProperties = (data?.data || []).map(transformProperty);

  // Client-side amenity and bedroom filters (not supported server-side)
  const filtered = useMemo(() => {
    let results = [...rawProperties];

    if (bedroomFilter !== "Any") {
      if (bedroomFilter === "Studio") {
        results = results.filter((p) => p.bedrooms === 0 && p.type === "Studio");
      } else if (bedroomFilter === "4+") {
        results = results.filter((p) => p.bedrooms >= 4);
      } else {
        results = results.filter((p) => p.bedrooms === parseInt(bedroomFilter));
      }
    }

    if (selectedAmenities.length > 0) {
      results = results.filter((p) =>
        selectedAmenities.every((a) => p.amenities.includes(a))
      );
    }

    if (sortBy === "price-asc") results.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") results.sort((a, b) => b.price - a.price);

    return results;
  }, [rawProperties, bedroomFilter, selectedAmenities, sortBy]);

  const total = data?.pagination?.total || filtered.length;
  const totalPages = data?.pagination?.pages || Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNav />

      <HeroSearch
        searchQuery={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        selectedCounty={selectedCounty}
        onCountyChange={(v) => { setSelectedCounty(v); setPage(1); }}
        selectedType={selectedType}
        onTypeChange={(v) => { setSelectedType(v); setPage(1); }}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={(v) => { setSelectedPriceRange(v); setPage(1); }}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
      />

      <div className="container mx-auto px-4 py-6 flex-1">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-muted-foreground font-body">
            {isLoading ? (
              <span>Loading properties…</span>
            ) : (
              <>
                <strong className="text-foreground">{total}</strong> properties found
                {selectedCounty !== "all" && ` in ${selectedCounty}`}
              </>
            )}
          </p>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 h-9 text-xs">
                <ArrowUpDown className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden md:flex items-center border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <FilterSidebar
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            selectedAmenities={selectedAmenities}
            onAmenitiesChange={setSelectedAmenities}
            bedroomFilter={bedroomFilter}
            onBedroomChange={setBedroomFilter}
            priceRange={priceSlider}
            onPriceRangeSliderChange={setPriceSlider}
            onClearAll={clearAll}
          />

          <div className="flex-1">
            {isLoading ? (
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-6 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Could not load properties</h3>
                <p className="text-sm text-muted-foreground font-body">Please check your connection and try again</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">No properties found</h3>
                <p className="text-sm text-muted-foreground font-body">Try adjusting your filters or search query</p>
                <button onClick={clearAll} className="mt-4 text-sm text-secondary font-body hover:underline">
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-5 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid-cols-1"
                }`}>
                  {filtered.map((property, i) => (
                    <div key={property.id} style={{ animationDelay: `${i * 80}ms` }}>
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`h-9 w-9 rounded-md text-sm font-body transition-colors ${
                          page === p
                            ? "bg-primary text-primary-foreground"
                            : "bg-card text-foreground border border-border hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
