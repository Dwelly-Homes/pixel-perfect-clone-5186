import { useState, useMemo } from "react";
import { LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { MarketplaceNav } from "@/components/marketplace/MarketplaceNav";
import { HeroSearch } from "@/components/marketplace/HeroSearch";
import { FilterSidebar } from "@/components/marketplace/FilterSidebar";
import { PropertyCard } from "@/components/marketplace/PropertyCard";
import { Footer } from "@/components/marketplace/Footer";
import { mockProperties, PRICE_RANGES } from "@/data/properties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [priceSlider, setPriceSlider] = useState<[number, number]>([0, 150000]);
  const [page, setPage] = useState(1);

  const clearAll = () => {
    setSelectedAmenities([]);
    setBedroomFilter("Any");
    setPriceSlider([0, 150000]);
    setSearchQuery("");
    setSelectedCounty("all");
    setSelectedType("All");
    setSelectedPriceRange("0");
  };

  const filtered = useMemo(() => {
    let results = [...mockProperties];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.location.neighborhood.toLowerCase().includes(q) ||
        p.location.county.toLowerCase().includes(q)
      );
    }

    // County
    if (selectedCounty !== "all") {
      results = results.filter(p => p.location.county === selectedCounty);
    }

    // Type
    if (selectedType !== "All") {
      results = results.filter(p => p.type === selectedType);
    }

    // Price range from hero dropdown
    const priceRangeIdx = parseInt(selectedPriceRange);
    if (priceRangeIdx > 0) {
      const range = PRICE_RANGES[priceRangeIdx];
      results = results.filter(p => p.price >= range.min && p.price <= range.max);
    }

    // Price slider
    results = results.filter(p => p.price >= priceSlider[0] && p.price <= priceSlider[1]);

    // Bedrooms
    if (bedroomFilter !== "Any") {
      if (bedroomFilter === "Studio") {
        results = results.filter(p => p.bedrooms === 0);
      } else if (bedroomFilter === "4+") {
        results = results.filter(p => p.bedrooms >= 4);
      } else {
        results = results.filter(p => p.bedrooms === parseInt(bedroomFilter));
      }
    }

    // Amenities
    if (selectedAmenities.length > 0) {
      results = results.filter(p =>
        selectedAmenities.every(a => p.amenities.includes(a))
      );
    }

    // Sort
    if (sortBy === "newest") results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sortBy === "price-asc") results.sort((a, b) => a.price - b.price);
    if (sortBy === "price-desc") results.sort((a, b) => b.price - a.price);

    return results;
  }, [searchQuery, selectedCounty, selectedType, selectedPriceRange, sortBy, selectedAmenities, bedroomFilter, priceSlider]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNav />

      <HeroSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCounty={selectedCounty}
        onCountyChange={setSelectedCounty}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={setSelectedPriceRange}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Results Area */}
      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Sort Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-muted-foreground font-body">
            <strong className="text-foreground">{filtered.length}</strong> properties found
            {selectedCounty !== "all" && ` in ${selectedCounty}`}
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
          {/* Sidebar */}
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

          {/* Properties Grid */}
          <div className="flex-1">
            {paginated.length === 0 ? (
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
                  {paginated.map((property, i) => (
                    <div key={property.id} style={{ animationDelay: `${i * 80}ms` }}>
                      <PropertyCard property={property} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
