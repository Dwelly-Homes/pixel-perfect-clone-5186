import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save, Upload, X, Star, Trash2, MapPin, LayoutGrid, Plus, Building2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCounties } from "@/hooks/useCounties";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { UNIT_TYPE_OPTIONS } from "@/data/properties";

// Fix leaflet default marker icon (broken with webpack/vite bundlers)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MAX_IMAGES = 10;

const PROPERTY_TYPES = [
  { value: "bedsitter", label: "Bedsitter" },
  { value: "studio", label: "Studio" },
  { value: "1_bedroom", label: "1 Bedroom" },
  { value: "2_bedroom", label: "2 Bedroom" },
  { value: "3_bedroom", label: "3 Bedroom" },
  { value: "4_plus_bedroom", label: "4+ Bedroom" },
  { value: "maisonette", label: "Maisonette" },
  { value: "bungalow", label: "Bungalow" },
  { value: "townhouse", label: "Townhouse" },
  { value: "commercial", label: "Commercial" },
];

const AMENITIES = [
  { key: "water", label: "Water Supply" },
  { key: "electricity", label: "Electricity" },
  { key: "parking", label: "Parking" },
  { key: "security", label: "Security/Guard" },
  { key: "cctv", label: "CCTV" },
  { key: "borehole", label: "Borehole" },
  { key: "pool", label: "Swimming Pool" },
  { key: "gym", label: "Gym" },
  { key: "generator", label: "Backup Generator" },
  { key: "balcony", label: "Balcony" },
  { key: "garden", label: "Garden/Compound" },
  { key: "furnished", label: "Furnished" },
  { key: "wifi", label: "WiFi/Internet" },
  { key: "pet_friendly", label: "Pet Friendly" },
  { key: "dsq", label: "DSQ (Servant Quarter)" },
  { key: "intercom", label: "Intercom" },
];

interface ImageItem {
  id: string;
  file?: File;
  preview: string;
  isCover: boolean;
  isExisting?: boolean;
}

interface UnitRow {
  id: string;          // local key only
  unitNumber: string;  // free text: "1a", "101", "7K", etc.
  floorNumber: string;
  unitType: string;
  monthlyRent: string;
  serviceCharge: string;
}

const emptyUnitRow = (): UnitRow => ({
  id: crypto.randomUUID(),
  unitNumber: "",
  floorNumber: "",
  unitType: "",
  monthlyRent: "",
  serviceCharge: "",
});

// Map click handler component
function LocationPicker({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [price, setPrice] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [county, setCounty] = useState("");
  const [status, setStatus] = useState("available");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Images
  const [images, setImages] = useState<ImageItem[]>([]);

  // Units (new-property flow only)
  const [unitRows, setUnitRows] = useState<UnitRow[]>([]);

  // Map / location
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  // Fetch counties
  const { data: counties = [] } = useCounties();
  const countyNames = counties.map(c => c.name);

  // Load existing property for editing
  const { data: editData, isLoading: loadingProperty } = useQuery({
    queryKey: ["editProperty", id],
    enabled: isEditing,
    queryFn: async () => {
      const { data } = await api.get(`/properties/${id}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDescription(editData.description || "");
      setPropertyType(editData.propertyType || "");
      setPrice(String(editData.monthlyRent || ""));
      setServiceCharge(String(editData.serviceCharge || ""));
      setNeighborhood(editData.neighborhood || "");
      setCounty(editData.county || "");
      setStatus(editData.status || "available");
      setSelectedAmenities(editData.amenities || []);
      if (editData.lat) setLat(editData.lat);
      if (editData.lng) setLng(editData.lng);
      // Load existing images
      if (editData.images?.length) {
        const existing: ImageItem[] = editData.images.map(
          (img: { url: string; isCover: boolean }, idx: number) => ({
            id: crypto.randomUUID(),
            preview: img.url,
            isCover: img.isCover ?? idx === 0,
            isExisting: true,
          })
        );
        setImages(existing);
      }
    }
  }, [editData]);

  // Image upload handling
  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const remaining = MAX_IMAGES - images.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_IMAGES} images allowed`);
        return;
      }
      const toAdd = Array.from(files).slice(0, remaining);
      const newItems: ImageItem[] = [];
      for (const file of toAdd) {
        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
          toast.error(`${file.name} is not a valid image (JPG, PNG, WebP only)`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} exceeds 5MB`);
          continue;
        }
        newItems.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          isCover: images.length === 0 && newItems.length === 0,
        });
      }
      setImages((prev) => [...prev, ...newItems]);
    },
    [images]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeImage = (imgId: string) => {
    setImages((prev) => {
      const filtered = prev.filter((i) => i.id !== imgId);
      // If removed image was cover, make first the new cover
      const wasRemovedCover = prev.find((i) => i.id === imgId)?.isCover;
      if (wasRemovedCover && filtered.length > 0) {
        filtered[0].isCover = true;
      }
      return filtered;
    });
  };

  const setCover = (imgId: string) => {
    setImages((prev) => prev.map((i) => ({ ...i, isCover: i.id === imgId })));
  };

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const uploadImagesMutation = useMutation({
    mutationFn: ({ propertyId, files }: { propertyId: string; files: File[] }) => {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      return api.post(`/properties/${propertyId}/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  });

  const bulkUnitsMutation = useMutation({
    mutationFn: ({ propertyId, units }: { propertyId: string; units: Record<string, unknown>[] }) =>
      api.post(`/properties/${propertyId}/units/bulk`, { units }),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/properties", body),
    onSuccess: async (res) => {
      const propertyId = res.data?.data?._id;

      // Upload images
      const newFiles = images.filter((i) => i.file).map((i) => i.file!);
      if (propertyId && newFiles.length > 0) {
        try {
          await uploadImagesMutation.mutateAsync({ propertyId, files: newFiles });
        } catch {
          toast.warning("Property created but some images failed to upload.");
        }
      }

      // Bulk-create units if any were filled in
      const validUnits = unitRows.filter(
        (u) => u.unitNumber.trim() && u.unitType && u.monthlyRent && Number(u.monthlyRent) > 0
      );
      if (propertyId && validUnits.length > 0) {
        try {
          await bulkUnitsMutation.mutateAsync({
            propertyId,
            units: validUnits.map((u) => ({
              unitNumber: u.unitNumber.trim(),
              floorNumber: u.floorNumber !== "" ? Number(u.floorNumber) : undefined,
              unitType: u.unitType,
              monthlyRent: Number(u.monthlyRent),
              serviceCharge: u.serviceCharge !== "" ? Number(u.serviceCharge) : 0,
              status: "vacant",
            })),
          });
          toast.success(`Property created with ${validUnits.length} unit${validUnits.length > 1 ? "s" : ""}!`);
        } catch {
          toast.warning("Property created but some units failed to save.");
        }
      } else {
        toast.success("Property created! Add units to this property.");
      }

      if (propertyId) {
        navigate(`/dashboard/properties/${propertyId}/units`);
      } else {
        navigate("/dashboard/properties");
      }
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/properties/${id}`, body),
    onSuccess: async () => {
      const newFiles = images.filter((i) => i.file).map((i) => i.file!);
      if (id && newFiles.length > 0) {
        try {
          await uploadImagesMutation.mutateAsync({ propertyId: id, files: newFiles });
        } catch {
          toast.warning("Property updated but some images failed to upload.");
        }
      }
      toast.success("Property updated successfully!");
      navigate("/dashboard/properties");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !propertyType || !price || !neighborhood || !county) {
      toast.error("Please fill in all required fields");
      return;
    }

    const body: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim(),
      propertyType,
      monthlyRent: Number(price),
      serviceCharge: serviceCharge ? Number(serviceCharge) : 0,
      neighborhood: neighborhood.trim(),
      county,
      status,
      amenities: selectedAmenities,
    };
    if (lat !== null && lng !== null) {
      body.coordinates = { lat, lng };
    }

    if (isEditing) {
      updateMutation.mutate(body);
    } else {
      createMutation.mutate(body);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending || uploadImagesMutation.isPending || bulkUnitsMutation.isPending;

  // Default map center — Nairobi, Kenya
  const mapCenter: [number, number] =
    lat !== null && lng !== null ? [lat, lng] : [-1.2921, 36.8219];

  if (isEditing && loadingProperty) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard/properties">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">
              {isEditing ? "Edit Property" : "Add Property"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isEditing
                ? "Update your property details — manage individual units separately"
                : "Create the property (building/apartment), then add units"}
            </p>
          </div>
        </div>
        {isEditing && id && (
          <Button asChild variant="outline" className="shrink-0">
            <Link to={`/dashboard/properties/${id}/units`}>
              <LayoutGrid className="h-4 w-4 mr-2" />
              Manage Units
            </Link>
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Property Title *</Label>
              <Input
                id="title"
                placeholder="e.g. Modern 2BR Apartment with City Views"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your property in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property Type *</Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Pricing */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Location & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="neighborhood">Neighborhood *</Label>
                <Input
                  id="neighborhood"
                  placeholder="e.g. Kilimani"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label>County *</Label>
                <Select value={county} onValueChange={setCounty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    {countyNames.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Rent (KES) *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KES</span>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceCharge">Service Charge (KES)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">KES</span>
                  <Input
                    id="serviceCharge"
                    type="number"
                    min="0"
                    step="500"
                    placeholder="0"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>
            </div>

            {/* Map Picker */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Pin Property Location on Map
                <span className="text-xs text-muted-foreground font-normal">(optional — click to set)</span>
              </Label>
              <div className="rounded-lg overflow-hidden border h-72">
                <MapContainer
                  center={mapCenter}
                  zoom={12}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <LocationPicker
                    onSelect={(lt, ln) => {
                      setLat(lt);
                      setLng(ln);
                    }}
                  />
                  {lat !== null && lng !== null && (
                    <Marker position={[lat, lng]} />
                  )}
                </MapContainer>
              </div>
              {lat !== null && lng !== null ? (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Selected: {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                  <button
                    type="button"
                    className="text-xs text-destructive hover:underline"
                    onClick={() => { setLat(null); setLng(null); }}
                  >
                    Clear location
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Click anywhere on the map to pin the property location.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading flex items-center justify-between">
              <span>Property Photos</span>
              <span className="text-sm font-normal text-muted-foreground">{images.length} / {MAX_IMAGES}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            {images.length < MAX_IMAGES && (
              <div
                className={`border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  dragging
                    ? "border-secondary bg-secondary/5"
                    : "border-border hover:border-secondary/60"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">Drag photos here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP · Max 5MB per file · Up to {MAX_IMAGES} images
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>
            )}

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative group aspect-square rounded-lg overflow-hidden bg-muted border"
                  >
                    <img
                      src={img.preview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    {img.isCover && (
                      <Badge className="absolute top-1 left-1 bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0">
                        Cover
                      </Badge>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 transition-all flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                      {!img.isCover && (
                        <button
                          type="button"
                          className="h-7 w-7 rounded-full bg-white/80 hover:bg-secondary hover:text-white flex items-center justify-center transition-colors"
                          title="Set as cover"
                          onClick={() => setCover(img.id)}
                        >
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="h-7 w-7 rounded-full bg-white/80 hover:bg-destructive hover:text-white flex items-center justify-center transition-colors"
                        title="Remove photo"
                        onClick={() => removeImage(img.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Empty slot indicators */}
                {Array.from({ length: MAX_IMAGES - images.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-secondary/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <X className="h-4 w-4 text-border rotate-45" />
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Add at least 1 photo to make your listing more attractive.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {AMENITIES.map((amenity) => (
                <label
                  key={amenity.key}
                  className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground transition-colors"
                >
                  <Checkbox
                    checked={selectedAmenities.includes(amenity.key)}
                    onCheckedChange={() => toggleAmenity(amenity.key)}
                  />
                  <span
                    className={
                      selectedAmenities.includes(amenity.key)
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }
                  >
                    {amenity.label}
                  </span>
                </label>
              ))}
            </div>
            {selectedAmenities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedAmenities.map((key) => {
                  const amenity = AMENITIES.find((a) => a.key === key);
                  return (
                    <Badge
                      key={key}
                      variant="secondary"
                      className="gap-1 cursor-pointer"
                      onClick={() => toggleAmenity(key)}
                    >
                      {amenity?.label || key}
                      <span className="ml-0.5">×</span>
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Units — new properties only */}
        {!isEditing && (
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    Units
                    {unitRows.length > 0 && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        ({unitRows.length})
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Optional — add individual rental units now, or later from the Units page.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setUnitRows((prev) => [...prev, emptyUnitRow()])}
                >
                  <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Unit
                </Button>
              </div>
            </CardHeader>
            {unitRows.length > 0 && (
              <CardContent className="space-y-2 pt-0">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_70px_1fr_110px_100px_32px] gap-2 px-1 pb-1">
                  <span className="text-xs font-medium text-muted-foreground">Unit Name / No.</span>
                  <span className="text-xs font-medium text-muted-foreground">Floor</span>
                  <span className="text-xs font-medium text-muted-foreground">Type</span>
                  <span className="text-xs font-medium text-muted-foreground">Rent (KES)</span>
                  <span className="text-xs font-medium text-muted-foreground">Svc. Charge</span>
                  <span />
                </div>

                <div className="space-y-2">
                  {unitRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-[1fr_70px_1fr_110px_100px_32px] gap-2 items-center"
                    >
                      {/* Unit number — free text */}
                      <Input
                        value={row.unitNumber}
                        onChange={(e) =>
                          setUnitRows((prev) =>
                            prev.map((r) => r.id === row.id ? { ...r, unitNumber: e.target.value } : r)
                          )
                        }
                        placeholder="e.g. 1A, 101, 7K"
                        className="h-8 text-sm"
                        maxLength={20}
                      />

                      {/* Floor */}
                      <Input
                        type="number"
                        value={row.floorNumber}
                        onChange={(e) =>
                          setUnitRows((prev) =>
                            prev.map((r) => r.id === row.id ? { ...r, floorNumber: e.target.value } : r)
                          )
                        }
                        placeholder="—"
                        className="h-8 text-sm"
                        min={0}
                      />

                      {/* Type */}
                      <Select
                        value={row.unitType}
                        onValueChange={(v) =>
                          setUnitRows((prev) =>
                            prev.map((r) => r.id === row.id ? { ...r, unitType: v } : r)
                          )
                        }
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {UNIT_TYPE_OPTIONS.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Rent */}
                      <Input
                        type="number"
                        value={row.monthlyRent}
                        onChange={(e) =>
                          setUnitRows((prev) =>
                            prev.map((r) => r.id === row.id ? { ...r, monthlyRent: e.target.value } : r)
                          )
                        }
                        placeholder="0"
                        className="h-8 text-sm"
                        min={0}
                        step={500}
                      />

                      {/* Service charge */}
                      <Input
                        type="number"
                        value={row.serviceCharge}
                        onChange={(e) =>
                          setUnitRows((prev) =>
                            prev.map((r) => r.id === row.id ? { ...r, serviceCharge: e.target.value } : r)
                          )
                        }
                        placeholder="0"
                        className="h-8 text-sm"
                        min={0}
                        step={500}
                      />

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() =>
                          setUnitRows((prev) => prev.filter((r) => r.id !== row.id))
                        }
                        className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        title="Remove row"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground pt-1">
                  Unit names are flexible — use any convention that fits your property (101, A1, 7K…).
                  Rows with an empty name or type will be skipped.
                </p>
              </CardContent>
            )}
          </Card>
        )}

        <Separator />

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/properties">Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto bg-secondary hover:bg-orange-dark text-secondary-foreground"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEditing ? "Saving…" : "Publishing…"}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isEditing ? "Save Changes" : "Save & Add Units"}
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
