import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
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

const ITEMS_PER_PAGE = 12;

function PropertySkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        <div className="h-6 bg-muted rounded w-1/3 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 bg-muted rounded w-16 animate-pulse" />
          <div className="h-5 bg-muted rounded w-20 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
          <div className="h-3 bg-muted rounded w-24 animate-pulse" />
        </div>
        <div className="h-9 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

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

  // Sentinel always lives in the DOM — observer is set up once
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Use refs so the observer callback always has the latest values
  // without needing to be recreated
  const hasNextPageRef = useRef(false);
  const isFetchingNextPageRef = useRef(false);
  const fetchNextPageRef = useRef<() => void>(() => {});

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

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["marketplace", searchQuery, selectedCounty, selectedType, priceRangeIdx, priceSlider, sortBy],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCounty !== "all") params.set("county", selectedCounty);
      if (selectedType !== "All" && typeToBackend[selectedType]) params.set("propertyType", typeToBackend[selectedType]);
      const minPrice = priceRange ? priceRange.min : priceSlider[0];
      const maxPrice = priceRange
        ? (priceRange.max === Infinity ? priceSlider[1] : Math.min(priceRange.max, priceSlider[1]))
        : priceSlider[1];
      if (minPrice > 0) params.set("minPrice", String(minPrice));
      if (maxPrice < 500000) params.set("maxPrice", String(maxPrice));
      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("page", String(pageParam));
      const { data } = await api.get(`/properties/marketplace?${params.toString()}`);
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const p = lastPage?.meta;
      if (!p) return undefined;
      const currentPage = Number(p.page ?? 0);
      const totalPages = Number(p.totalPages ?? 0);
      if (!currentPage || !totalPages) return undefined;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  // Keep refs in sync with latest query state
  useEffect(() => { hasNextPageRef.current = !!hasNextPage; }, [hasNextPage]);
  useEffect(() => { isFetchingNextPageRef.current = isFetchingNextPage; }, [isFetchingNextPage]);
  useEffect(() => { fetchNextPageRef.current = fetchNextPage; }, [fetchNextPage]);

  // Set up observer ONCE on mount — sentinel is always in the DOM
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current
        ) {
          fetchNextPageRef.current();
        }
      },
      { rootMargin: "400px", threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []); // intentionally empty — refs handle freshness

  const clearAll = useCallback(() => {
    setSelectedAmenities([]);
    setBedroomFilter("Any");
    setPriceSlider([0, 500000]);
    setSearchQuery("");
    setSelectedCounty("all");
    setSelectedType("All");
    setSelectedPriceRange("0");
  }, []);

  const allRaw = useMemo(() => {
    return (data?.pages ?? []).flatMap((page) =>
      (page?.data ?? []).map(transformProperty)
    );
  }, [data]);

  const filtered = useMemo(() => {
    let results = [...allRaw];

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
  }, [allRaw, bedroomFilter, selectedAmenities, sortBy]);

  const total = data?.pages?.[0]?.meta?.total ?? filtered.length;

  const gridClass = viewMode === "grid"
    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
    : "grid-cols-1";

  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNav />

      <HeroSearch
        searchQuery={searchQuery}
        onSearchChange={(v) => setSearchQuery(v)}
        selectedCounty={selectedCounty}
        onCountyChange={(v) => setSelectedCounty(v)}
        selectedType={selectedType}
        onTypeChange={(v) => setSelectedType(v)}
        selectedPriceRange={selectedPriceRange}
        onPriceRangeChange={(v) => setSelectedPriceRange(v)}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
      />

      <div className="container mx-auto px-4 py-6 flex-1 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <p className="text-sm text-muted-foreground font-body">
            {isLoading ? (
              <span className="inline-block h-4 w-36 bg-muted rounded animate-pulse" />
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

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className={`grid gap-5 ${gridClass}`}>
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <PropertySkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  Could not load properties
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  Please check your connection and try again
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  No properties found
                </h3>
                <p className="text-sm text-muted-foreground font-body">
                  Try adjusting your filters or search query
                </p>
                <button
                  onClick={clearAll}
                  className="mt-4 text-sm text-secondary font-body hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className={`grid gap-5 ${gridClass}`}>
                {filtered.map((property, i) => (
                  <div
                    key={`${property.id}-${i}`}
                    className="animate-fade-in"
                    style={{ animationDelay: `${Math.min(i % ITEMS_PER_PAGE, 8) * 60}ms` }}
                  >
                    <PropertyCard property={property} />
                  </div>
                ))}

                {/* Inline ghost skeletons while loading more */}
                {isFetchingNextPage &&
                  Array.from({ length: 3 }).map((_, i) => (
                    <PropertySkeleton key={`skel-${i}`} />
                  ))
                }
              </div>
            )}

            {/* Sentinel is ALWAYS in the DOM so the observer can attach on mount */}
            <div ref={sentinelRef} className="h-1 w-full" aria-hidden />

            {!isLoading && !hasNextPage && filtered.length > 0 && (
              <p className="text-center text-xs text-muted-foreground font-body mt-8 pb-4">
                You've seen all {total} properties
              </p>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
