import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, BadgeCheck, Shield, Heart, Share2,
  Check, ChevronLeft, ChevronRight, X, Send, Eye, Calendar,
  Globe, Pencil, AlertTriangle, ExternalLink, Building2, Layers,
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});
import { MarketplaceNav } from "@/components/marketplace/MarketplaceNav";
import { Footer } from "@/components/marketplace/Footer";
import { InquiryModal } from "@/components/marketplace/InquiryModal";
import { ViewingModal } from "@/components/marketplace/ViewingModal";
import { PropertyCard } from "@/components/marketplace/PropertyCard";
import { ShareModal } from "@/components/marketplace/ShareModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { transformProperty, transformUnit } from "@/lib/propertyTransform";
import type { Unit } from "@/data/properties";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function PropertyDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [viewingOpen, setViewingOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | undefined>();
  const [unitStatusFilter, setUnitStatusFilter] = useState<"all" | "vacant" | "occupied">("all");

  const saveMutation = useMutation({
    mutationFn: () =>
      favorited ? api.delete(`/properties/${id}/save`) : api.post(`/properties/${id}/save`),
    onSuccess: () => {
      setFavorited((v) => !v);
      queryClient.invalidateQueries({ queryKey: ["savedProperties"] });
      toast.success(favorited ? "Removed from saved" : "Property saved!");
    },
    onError: () => toast.error("Failed to update saved properties"),
  });

  function handleHeartClick() {
    if (!isAuthenticated) {
      toast.info("Please log in to save properties");
      return;
    }
    saveMutation.mutate();
  }

  const { data: rawProperty, isLoading, isError } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await api.get(`/properties/marketplace/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  const { data: relatedRaw = [] } = useQuery({
    queryKey: ["relatedProperties", rawProperty?.county],
    queryFn: async () => {
      const { data } = await api.get(`/properties/marketplace?county=${rawProperty?.county}&limit=4`);
      return (data.data || []).filter((p: { _id: string }) => p._id !== id);
    },
    enabled: !!rawProperty?.county,
  });

  // Units come embedded in the marketplace response — never call the
  // auth-protected /units endpoint here (would redirect guests to login).
  const units: Unit[] = rawProperty?.units ? (rawProperty.units as unknown[]).map(transformUnit) : [];

  const publishMutation = useMutation({
    mutationFn: (publish: boolean) =>
      api.patch(`/properties/${id}`, {
        status: publish ? "available" : "draft",
        ...(publish ? { expiresAt: new Date(Date.now() + 90 * 86400000).toISOString() } : {}),
      }),
    onSuccess: (_, publish) => {
      queryClient.invalidateQueries({ queryKey: ["property", id] });
      toast.success(publish ? "Property published!" : "Property unpublished");
    },
    onError: () => toast.error("Failed to update property status"),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MarketplaceNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isError || !rawProperty) {
    return (
      <div className="min-h-screen flex flex-col">
        <MarketplaceNav />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Property not found</h2>
            <Link to="/" className="text-secondary hover:underline font-body">← Back to marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  const property = transformProperty(rawProperty);
  const formattedPrice = new Intl.NumberFormat("en-KE").format(property.price);
  const relatedProperties = relatedRaw.slice(0, 4).map(transformProperty);

  // Detect if the logged-in user owns this property
  const ownerTenantId = typeof rawProperty.tenantId === "object"
    ? rawProperty.tenantId?._id?.toString()
    : rawProperty.tenantId?.toString();
  const isOwner = !!(user?.tenantId && user.tenantId === ownerTenantId);
  const isDraft = rawProperty.status === "draft";
  const isExpired = rawProperty.status === "expired";

  // Determine back destination based on where the user actually came from.
  // PropertyList passes state={{ from: "dashboard" }} on its Preview link.
  const cameFromDashboard = (location.state as { from?: string } | null)?.from === "dashboard";
  const backLink = (isOwner || cameFromDashboard) ? "/dashboard/properties" : "/";
  const backText = (isOwner || cameFromDashboard) ? "My Properties" : "All Properties";

  const nextImage = () => setCurrentImage((i) => (i + 1) % property.images.length);
  const prevImage = () => setCurrentImage((i) => (i - 1 + property.images.length) % property.images.length);

  return (
    <div className="min-h-screen flex flex-col">
      <MarketplaceNav />

      <div className="container mx-auto px-4 py-6 flex-1">
        <Link to={backLink} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>{backText}</span>
        </Link>

        {isOwner && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 text-sm font-body">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span className="flex-1">
              {isDraft ? "This property is a draft and not visible to the public." : isExpired ? "This listing has expired." : "You are viewing your own listing."}
            </span>
            <Link to={`/dashboard/properties/${rawProperty._id}/edit`} className="shrink-0">
              <Button size="sm" variant="outline" className="h-7 text-xs border-amber-400 text-amber-800 hover:bg-amber-100">
                <Pencil className="h-3 w-3 mr-1" /> Edit
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
              <img
                src={property.images[currentImage]}
                alt={property.title}
                className="h-full w-full object-cover cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
              {property.images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {property.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImage(i)}
                    className={`h-2 rounded-full transition-all ${i === currentImage ? "w-6 bg-secondary" : "w-2 bg-card/60"}`}
                  />
                ))}
              </div>
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                {property.agent.earbLicensed && (
                  <Badge className="bg-success text-success-foreground text-xs shadow-sm">
                    <Shield className="mr-1 h-3 w-3" /> EARB Licensed
                  </Badge>
                )}
                {property.agent.verified && (
                  <Badge className="bg-info text-info-foreground text-xs shadow-sm">
                    <BadgeCheck className="mr-1 h-3 w-3" /> Verified Agent
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {property.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentImage(i)}
                  className={`shrink-0 h-16 w-24 rounded-md overflow-hidden border-2 transition-colors ${
                    i === currentImage ? "border-secondary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
              <button
                onClick={() => setLightboxOpen(true)}
                className="shrink-0 h-16 w-24 rounded-md bg-muted flex items-center justify-center text-xs font-body text-muted-foreground hover:bg-muted/80"
              >
                <Eye className="h-4 w-4 mr-1" /> View All
              </button>
            </div>

            {/* Title + Price */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">{property.title}</h1>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground font-body">
                    <MapPin className="h-4 w-4" />
                    Kenya › {property.location.county} › {property.location.neighborhood}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleHeartClick}
                    disabled={saveMutation.isPending}
                    className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Heart className={`h-5 w-5 ${favorited ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                  </button>
                  <button 
                    onClick={() => setShareOpen(true)}
                    className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <Share2 className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="font-heading text-3xl font-bold text-secondary">
                  KES {formattedPrice}
                  <span className="text-sm font-normal text-muted-foreground font-body"> / month</span>
                </div>
                <Badge variant="outline" className="font-body">{property.type}</Badge>
                {property.bedrooms > 0 && (
                  <Badge variant="outline" className="font-body">{property.bedrooms} Bedroom{property.bedrooms > 1 ? "s" : ""}</Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Features & Amenities</h2>
                <div className="flex flex-wrap gap-x-6 gap-y-3">
                  {property.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm font-body text-foreground">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Units */}
            {units.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    Available Units
                    <span className="text-sm font-normal text-muted-foreground font-body">
                      ({units.filter((u) => u.status === "vacant").length} of {units.length} vacant)
                    </span>
                  </h2>
                  <div className="flex items-center gap-1 text-xs font-body">
                    {(["all", "vacant", "occupied"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setUnitStatusFilter(f)}
                        className={`px-2.5 py-1 rounded-md capitalize transition-colors ${
                          unitStatusFilter === f
                            ? "bg-secondary text-secondary-foreground"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="divide-y divide-border rounded-lg border overflow-hidden">
                  {units
                    .filter((u) => unitStatusFilter === "all" || u.status === unitStatusFilter)
                    .map((unit) => (
                      <div key={unit.id} className="flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-medium font-body w-14">{unit.unitNumber}</div>
                          <div className="text-sm text-muted-foreground font-body">
                            {unit.floorNumber !== undefined ? `Floor ${unit.floorNumber}` : "—"}
                          </div>
                          <Badge variant="outline" className="font-body text-xs">{unit.typeLabel}</Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              unit.status === "vacant"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {unit.status === "vacant" ? "Vacant" : "Occupied"}
                          </span>
                          <span className="font-heading font-bold text-secondary text-sm whitespace-nowrap">
                            KES {unit.price.toLocaleString()}
                            <span className="text-xs font-normal text-muted-foreground font-body">/mo</span>
                          </span>
                          {unit.status === "vacant" && !isOwner && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                              onClick={() => {
                                setSelectedUnitId(unit.id);
                                setInquiryOpen(true);
                              }}
                            >
                              <Send className="h-3 w-3 mr-1" /> Inquire
                            </Button>
                          )}
                          {isOwner && (
                            <Link
                              to={`/dashboard/properties/${rawProperty._id}/units`}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-secondary transition-colors"
                            >
                              <Pencil className="h-3 w-3" /> Manage
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  {units.filter((u) => unitStatusFilter === "all" || u.status === unitStatusFilter).length === 0 && (
                    <div className="text-center py-8 text-sm text-muted-foreground font-body">
                      No {unitStatusFilter === "all" ? "" : unitStatusFilter} units found.
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground font-body flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" />
                  Prices may vary per unit. Contact the agent for full details.
                </p>
              </div>
            )}

            {/* Location */}
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-3">Location</h2>
              {(() => {
                const hasPin = !!(rawProperty.coordinates?.lat && rawProperty.coordinates?.lng);
                const center: [number, number] = [property.location.lat, property.location.lng];
                const zoom = hasPin ? 15 : 11;
                return (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden border border-border h-72">
                      <a
                        href={`https://www.openstreetmap.org/?mlat=${center[0]}&mlon=${center[1]}#map=${zoom}/${center[0]}/${center[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 z-[1000] h-8 px-3 rounded-md bg-card/90 backdrop-blur-sm border border-border flex items-center gap-1.5 text-xs font-body text-foreground hover:bg-card transition-colors shadow-sm"
                        title="Open full map in new tab"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Full Map
                      </a>
                      <MapContainer
                        key={`${center[0]}-${center[1]}`}
                        center={center}
                        zoom={zoom}
                        scrollWheelZoom={false}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        {hasPin && (
                          <Marker position={center}>
                            <Popup className="font-body text-sm">
                              <strong className="font-heading">{property.title}</strong>
                              <br />
                              {property.location.neighborhood}, {property.location.county}
                            </Popup>
                          </Marker>
                        )}
                      </MapContainer>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                      <MapPin className="h-4 w-4 shrink-0 text-secondary" />
                      <span>
                        {property.location.neighborhood}, {property.location.county}
                        {!hasPin && (
                          <span className="ml-1 text-xs opacity-70">— exact pin not set</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right column — Agent + Contact / Owner Actions */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">
              {isOwner ? (
                <div className="rounded-xl border border-border bg-card p-5 space-y-4">
                  <p className="text-sm font-heading font-semibold">Your Listing</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
                      rawProperty.status === "available" ? "bg-green-100 text-green-700" :
                      rawProperty.status === "draft" ? "bg-amber-100 text-amber-700" :
                      rawProperty.status === "expired" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>{rawProperty.status}</span>
                  </div>
                  <div className="space-y-2">
                    {isDraft && (
                      <button
                        onClick={() => publishMutation.mutate(true)}
                        disabled={publishMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-secondary py-2.5 text-sm font-body font-medium text-secondary-foreground hover:bg-orange-dark transition-colors disabled:opacity-60"
                      >
                        <Globe className="h-4 w-4" />
                        {publishMutation.isPending ? "Publishing…" : "Publish Listing"}
                      </button>
                    )}
                    {rawProperty.status === "available" && (
                      <button
                        onClick={() => publishMutation.mutate(false)}
                        disabled={publishMutation.isPending}
                        className="w-full flex items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-body font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60"
                      >
                        {publishMutation.isPending ? "Updating…" : "Unpublish"}
                      </button>
                    )}
                    <Link to={`/dashboard/properties/${rawProperty._id}/edit`} className="block">
                      <button className="w-full flex items-center justify-center gap-2 rounded-md border border-primary py-2.5 text-sm font-body font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors">
                        <Pencil className="h-4 w-4" /> Edit Property
                      </button>
                    </Link>
                    <Link to="/dashboard/properties" state={{ from: "dashboard" }} className="block">
                      <button className="w-full flex items-center justify-center gap-2 rounded-md border border-border py-2.5 text-sm font-body font-medium text-muted-foreground hover:bg-muted transition-colors">
                        ← My Properties
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {property.agent.name.charAt(0)}
                    </div>
                    <div>
                      <Link to={`/marketplace/agents/${property.agent.slug}`} className="font-heading font-semibold text-foreground hover:text-secondary transition-colors">
                        {property.agent.agency}
                      </Link>
                      <p className="text-xs text-muted-foreground font-body">{property.agent.name}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {property.agent.verified && (
                      <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                        <BadgeCheck className="h-4 w-4 text-info" /> Verified Agent
                      </div>
                    )}
                    {property.agent.earbLicensed && (
                      <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
                        <Shield className="h-4 w-4 text-success" /> EARB Licensed
                      </div>
                    )}
                    <div className="text-xs font-body text-muted-foreground">Member since {property.agent.memberSince}</div>
                    <div className="text-xs font-body text-muted-foreground">Responds within {property.agent.responseRate}</div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setInquiryOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-md bg-secondary py-2.5 text-sm font-body font-medium text-secondary-foreground hover:bg-orange-dark transition-colors"
                    >
                      <Send className="h-4 w-4" /> Send Inquiry
                    </button>
                    <button
                      onClick={() => setViewingOpen(true)}
                      className="w-full flex items-center justify-center gap-2 rounded-md border border-primary py-2.5 text-sm font-body font-medium text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <Calendar className="h-4 w-4" /> Request Viewing
                    </button>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card p-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Type</p>
                  <p className="text-sm font-medium text-foreground font-body">{property.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Bedrooms</p>
                  <p className="text-sm font-medium text-foreground font-body">{property.bedrooms === 0 ? "Studio" : property.bedrooms}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">County</p>
                  <p className="text-sm font-medium text-foreground font-body">{property.location.county}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Status</p>
                  <Badge className={`text-xs mt-0.5 capitalize ${
                    rawProperty.status === "available" ? "bg-success text-success-foreground" :
                    rawProperty.status === "draft" ? "bg-amber-100 text-amber-800 border-0" :
                    "bg-muted text-muted-foreground border-0"
                  }`}>{rawProperty.status}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Listings */}
        {relatedProperties.length > 0 && (
          <div className="mt-12">
            <h2 className="font-heading text-xl font-semibold text-foreground mb-6">
              More properties in {property.location.county}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {relatedProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-primary-foreground/80 hover:text-primary-foreground" onClick={() => setLightboxOpen(false)}>
            <X className="h-8 w-8" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 text-primary-foreground/80 hover:text-primary-foreground">
            <ChevronLeft className="h-10 w-10" />
          </button>
          <img
            src={property.images[currentImage]}
            alt={property.title}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 text-primary-foreground/80 hover:text-primary-foreground">
            <ChevronRight className="h-10 w-10" />
          </button>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-primary-foreground/60 text-sm font-body">
            {currentImage + 1} / {property.images.length}
          </div>
        </div>
      )}

      <InquiryModal
        open={inquiryOpen}
        onClose={() => { setInquiryOpen(false); setSelectedUnitId(undefined); }}
        propertyId={rawProperty._id}
        propertyTitle={property.title}
        agentName={property.agent.name}
        units={units.map((u) => ({
          id: u.id,
          label: `${u.unitNumber} · ${u.typeLabel} · KES ${u.price.toLocaleString()}`,
          status: u.status,
        }))}
        preselectedUnitId={selectedUnitId}
      />
      <ViewingModal
        open={viewingOpen}
        onClose={() => { setViewingOpen(false); setSelectedUnitId(undefined); }}
        propertyId={rawProperty._id}
        propertyTitle={property.title}
        units={units.map((u) => ({
          id: u.id,
          label: `${u.unitNumber} · ${u.typeLabel} · KES ${u.price.toLocaleString()}`,
          status: u.status,
        }))}
        preselectedUnitId={selectedUnitId}
      />
      
      <ShareModal 
        open={shareOpen} 
        onClose={() => setShareOpen(false)} 
        url={window.location.href} 
        title={property.title} 
      />
    </div>
  );
}
