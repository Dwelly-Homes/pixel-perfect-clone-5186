import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROPERTY_TYPES, PRICE_RANGES } from "@/data/properties";
import { useCounties } from "@/hooks/useCounties";
import heroImage from "@/assets/hero-nairobi.jpg";

interface HeroSearchProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCounty: string;
  onCountyChange: (val: string) => void;
  selectedType: string;
  onTypeChange: (val: string) => void;
  selectedPriceRange: string;
  onPriceRangeChange: (val: string) => void;
  onToggleFilters: () => void;
}

export function HeroSearch({
  searchQuery,
  onSearchChange,
  selectedCounty,
  onCountyChange,
  selectedType,
  onTypeChange,
  selectedPriceRange,
  onPriceRangeChange,
  onToggleFilters,
}: HeroSearchProps) {
  const { data: counties = [] } = useCounties();
  const countyNames = counties.map(c => c.name);

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/85 via-navy/75 to-navy/90" />
      </div>

      <div className="relative container mx-auto px-4 py-16 md:py-24">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl md:text-5xl font-bold text-primary-foreground mb-3">
            Find Your Next Home in Kenya
          </h1>
          <p className="text-primary-foreground/80 text-base md:text-lg max-w-2xl mx-auto font-body">
            Kenya's Trusted Property Marketplace — Browse verified rental listings from licensed agents across all 47 counties
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-4xl mx-auto bg-card rounded-xl shadow-xl p-3 md:p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by location, neighborhood, or estate..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-11 font-body"
              />
            </div>

            <Select value={selectedCounty} onValueChange={onCountyChange}>
              <SelectTrigger className="w-full md:w-44 h-11">
                <SelectValue placeholder="County" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {countyNames.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={onTypeChange}>
              <SelectTrigger className="w-full md:w-40 h-11">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPriceRange} onValueChange={onPriceRangeChange}>
              <SelectTrigger className="w-full md:w-44 h-11">
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                {PRICE_RANGES.map((r, i) => (
                  <SelectItem key={i} value={String(i)}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <button
              onClick={onToggleFilters}
              className="md:hidden flex items-center justify-center gap-2 h-11 px-4 rounded-md bg-muted text-foreground font-body text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
