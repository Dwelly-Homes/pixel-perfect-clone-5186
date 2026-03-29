import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AMENITIES_LIST } from "@/data/properties";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  bedroomFilter: string;
  onBedroomChange: (val: string) => void;
  priceRange: [number, number];
  onPriceRangeSliderChange: (val: [number, number]) => void;
  onClearAll: () => void;
}

const BEDROOM_OPTIONS = ["Any", "Studio", "1", "2", "3", "4+"];

export function FilterSidebar({
  open,
  onClose,
  selectedAmenities,
  onAmenitiesChange,
  bedroomFilter,
  onBedroomChange,
  priceRange,
  onPriceRangeSliderChange,
  onClearAll,
}: FilterSidebarProps) {
  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      onAmenitiesChange(selectedAmenities.filter(a => a !== amenity));
    } else {
      onAmenitiesChange([...selectedAmenities, amenity]);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-foreground/40 z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed md:sticky top-0 md:top-20 left-0 z-50 md:z-0
          h-full md:h-[calc(100vh-5rem)] w-72 md:w-64 shrink-0
          bg-card border-r md:border md:rounded-lg border-border
          overflow-y-auto p-5
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-foreground">Filters</h3>
          <div className="flex items-center gap-3">
            <button onClick={onClearAll} className="text-xs text-secondary hover:underline font-body">
              Clear All
            </button>
            <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Bedrooms */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-foreground mb-3 block font-body">Bedrooms</Label>
          <div className="flex flex-wrap gap-2">
            {BEDROOM_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => onBedroomChange(opt)}
                className={`px-3 py-1.5 rounded-md text-xs font-body transition-colors border ${
                  bedroomFilter === opt
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Slider */}
        <div className="mb-6">
          <Label className="text-sm font-medium text-foreground mb-3 block font-body">
            Price Range
          </Label>
          <Slider
            min={0}
            max={150000}
            step={5000}
            minStepsBetweenThumbs={1}
            value={priceRange}
            onValueChange={(val) => onPriceRangeSliderChange(val as [number, number])}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground font-body">
            <span>KES {new Intl.NumberFormat("en-KE").format(priceRange[0])}</span>
            <span>KES {new Intl.NumberFormat("en-KE").format(priceRange[1])}</span>
          </div>
        </div>

        {/* Amenities */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block font-body">Amenities</Label>
          <div className="space-y-2.5 max-h-64 overflow-y-auto">
            {AMENITIES_LIST.map(amenity => (
              <label key={amenity} className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={selectedAmenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                <span className="text-xs text-foreground font-body group-hover:text-secondary transition-colors">
                  {amenity}
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
