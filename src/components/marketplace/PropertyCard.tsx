import { Heart, MapPin, BadgeCheck, Shield, BedDouble, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Property, PropertyWithUnits } from "@/data/properties";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface PropertyCardProps {
  property: Property | PropertyWithUnits;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [favorited, setFavorited] = useState(false);
  const navigate = useNavigate();

  const multiUnit = "units" in property && property.totalUnits > 0;
  const formattedPrice = new Intl.NumberFormat("en-KE").format(
    multiUnit ? (property as PropertyWithUnits).startingPrice : property.price
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      favorited
        ? api.delete(`/properties/${property.id}/save`)
        : api.post(`/properties/${property.id}/save`),
    onSuccess: () => {
      setFavorited((v) => !v);
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
      toast.success(favorited ? "Removed from saved" : "Property saved!");
    },
    onError: () => toast.error("Failed to update saved properties"),
  });

  function handleHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.info("Please log in to save properties");
      return;
    }
    saveMutation.mutate();
  }

  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden transition-shadow hover:shadow-lg animate-fade-in">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={property.images[0]}
          alt={property.title}
          onClick={()=>navigate(`/marketplace/${property.id}`)}
          className="h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {property.agent.earbLicensed && (
            <Badge className="bg-success text-success-foreground text-xs font-medium shadow-sm">
              <Shield className="mr-1 h-3 w-3" /> EARB Licensed
            </Badge>
          )}
          {property.agent.verified && (
            <Badge className="bg-info text-info-foreground text-xs font-medium shadow-sm">
              <BadgeCheck className="mr-1 h-3 w-3" /> Verified Agent
            </Badge>
          )}
        </div>
        {/* Favorite */}
        <button
          onClick={handleHeartClick}
          disabled={saveMutation.isPending}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-card disabled:opacity-60"
          aria-label="Save property"
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              favorited ? "fill-secondary text-secondary" : "text-foreground/60"
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-heading font-semibold text-foreground line-clamp-2 text-sm leading-snug">
            {property.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>{property.location.neighborhood}, {property.location.county}</span>
        </div>

        <div className="font-heading text-lg font-bold text-secondary">
          {multiUnit && <span className="text-xs font-normal text-muted-foreground font-body mr-1">from</span>}
          KES {formattedPrice} <span className="text-xs font-normal text-muted-foreground font-body">/ month</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {multiUnit ? (
            <>
              <Badge variant="outline" className="text-xs font-body">
                <Building2 className="mr-1 h-3 w-3" />
                {(property as PropertyWithUnits).availableUnits} of {(property as PropertyWithUnits).totalUnits} vacant
              </Badge>
            </>
          ) : (
            <>
              <Badge variant="outline" className="text-xs font-body">{property.type}</Badge>
              {property.bedrooms > 0 && (
                <Badge variant="outline" className="text-xs font-body">
                  <BedDouble className="mr-1 h-3 w-3" /> {property.bedrooms} Bed{property.bedrooms > 1 ? "s" : ""}
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Agent */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {property.agent.name.charAt(0)}
          </div>
          <span className="text-xs text-muted-foreground">{property.agent.name}</span>
          {property.agent.verified && (
            <BadgeCheck className="h-3.5 w-3.5 text-info" />
          )}
        </div>

        <Link
          to={`/marketplace/${property.id}`}
          className="block w-full text-center rounded-md border border-primary py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
