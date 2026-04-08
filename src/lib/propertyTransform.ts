import type { Property, Unit, PropertyWithUnits } from "@/data/properties";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80";

// Map backend propertyType to frontend display string and bedroom count
const TYPE_MAP: Record<string, { label: string; bedrooms: number }> = {
  bedsitter:    { label: "Bedsitter",    bedrooms: 0 },
  studio:       { label: "Studio",       bedrooms: 0 },
  "1_bedroom":  { label: "1 Bedroom",    bedrooms: 1 },
  "2_bedroom":  { label: "2 Bedroom",    bedrooms: 2 },
  "3_bedroom":  { label: "3 Bedroom",    bedrooms: 3 },
  "4_plus_bedroom": { label: "4+ Bedroom", bedrooms: 4 },
  maisonette:   { label: "Maisonette",   bedrooms: 3 },
  bungalow:     { label: "Bungalow",     bedrooms: 3 },
  townhouse:    { label: "Townhouse",    bedrooms: 3 },
  commercial:   { label: "Commercial",   bedrooms: 0 },
};

// Map backend amenity keys to frontend display labels
const AMENITY_MAP: Record<string, string> = {
  water:           "Water Supply",
  electricity:     "Electricity",
  parking:         "Parking",
  security:        "Security/Guard",
  cctv:            "CCTV",
  borehole:        "Borehole",
  swimming_pool:   "Swimming Pool",
  gym:             "Gym",
  backup_generator: "Backup Generator",
  balcony:         "Balcony",
  garden:          "Garden/Compound",
  furnished:       "Furnished",
  wifi:            "WiFi/Internet",
  pet_friendly:    "Pet Friendly",
  dsq:             "Garden/Compound",
};

function mapAmenity(a: string): string {
  return AMENITY_MAP[a] || a;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformProperty(p: any): Property {
  const typeInfo = TYPE_MAP[p.propertyType] || { label: p.propertyType, bedrooms: 0 };

  // Extract images array — backend images are objects {url, publicId, isCover, order}
  const rawImages: { url: string; isCover?: boolean; order?: number }[] = p.images || [];
  const sortedImages = [...rawImages].sort((a, b) => {
    if (a.isCover) return -1;
    if (b.isCover) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const imageUrls = sortedImages.map((i) => i.url).filter(Boolean);
  const images = imageUrls.length > 0 ? imageUrls : [PLACEHOLDER_IMAGE];

  // Tenant info (populated as tenantId object)
  const tenant = p.tenantId && typeof p.tenantId === "object" ? p.tenantId : null;
  const agentUser = p.agentId && typeof p.agentId === "object" ? p.agentId : null;

  const agentName = agentUser?.fullName || tenant?.businessName || "Dwelly Agent";
  const agencyName = tenant?.businessName || "Dwelly Homes";
  const agentSlug = tenant?.slug || "dwelly-homes";
  const isVerified = tenant?.verificationStatus === "approved";
  const isEarbLicensed = !!(tenant?.earbNumber && tenant?.earbExpiryDate && new Date(tenant.earbExpiryDate) > new Date());

  return {
    id: p._id || p.id,
    title: p.title,
    description: p.description,
    type: typeInfo.label,
    bedrooms: typeInfo.bedrooms,
    price: p.monthlyRent,
    location: {
      neighborhood: p.neighborhood || "",
      county: p.county || "",
      lat: p.coordinates?.lat ?? -1.2921,
      lng: p.coordinates?.lng ?? 36.8219,
    },
    images,
    amenities: (p.amenities || []).map(mapAmenity),
    agent: {
      name: agentName,
      agency: agencyName,
      avatar: tenant?.logo || "",
      verified: isVerified,
      earbLicensed: isEarbLicensed,
      memberSince: new Date(p.createdAt || Date.now()).getFullYear(),
      responseRate: "< 2 hours",
      slug: agentSlug,
    },
    status: p.status === "available" ? "available" : p.status === "occupied" ? "occupied" : "under-maintenance",
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformUnit(u: any): Unit {
  const typeInfo = TYPE_MAP[u.unitType || u.type] || { label: u.unitType || u.type || "Unit", bedrooms: 0 };

  // Images can be objects {url, isCover, order} or plain strings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawImages: any[] = u.images || [];
  const sortedImages = [...rawImages].sort((a, b) => {
    if (a?.isCover) return -1;
    if (b?.isCover) return 1;
    return (a?.order ?? 0) - (b?.order ?? 0);
  });
  const imageUrls = sortedImages
    .map((i) => (typeof i === "string" ? i : i?.url))
    .filter(Boolean) as string[];

  return {
    id: u._id || u.id,
    propertyId: u.propertyId || "",
    unitNumber: u.unitNumber || "",
    floorNumber: u.floorNumber !== undefined ? Number(u.floorNumber) : undefined,
    type: u.unitType || u.type || "",
    typeLabel: typeInfo.label,
    price: u.monthlyRent ?? u.price ?? 0,
    serviceCharge: u.serviceCharge,
    status: u.status === "occupied" ? "occupied" : "vacant",
    images: imageUrls,
    notes: u.notes,
    createdAt: u.createdAt || new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function transformPropertyWithUnits(p: any): PropertyWithUnits {
  const base = transformProperty(p);
  const units: Unit[] = (p.units || []).map(transformUnit);
  const vacantUnits = units.filter((u) => u.status === "vacant");
  const startingPrice =
    units.length > 0 ? Math.min(...units.map((u) => u.price)) : base.price;

  return {
    ...base,
    price: startingPrice,
    units,
    totalUnits: p.totalUnits ?? units.length,
    availableUnits: p.availableUnits ?? vacantUnits.length,
    startingPrice,
  };
}
