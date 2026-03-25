import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
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
import { KENYAN_COUNTIES } from "@/data/properties";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

// Backend property type enum values and their display labels
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

// Backend amenity keys and their display labels
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

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [price, setPrice] = useState("");
  const [serviceCharge, setServiceCharge] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [county, setCounty] = useState("");
  const [status, setStatus] = useState("available");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

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
    }
  }, [editData]);

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/properties", body),
    onSuccess: () => {
      toast.success("Property created successfully!");
      navigate("/dashboard/properties");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch(`/properties/${id}`, body),
    onSuccess: () => {
      toast.success("Property updated successfully!");
      navigate("/dashboard/properties");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !propertyType || !price || !neighborhood || !county) {
      toast.error("Please fill in all required fields");
      return;
    }
    const body = {
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
    if (isEditing) {
      updateMutation.mutate(body);
    } else {
      createMutation.mutate(body);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

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
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/properties">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">
            {isEditing ? "Edit Property" : "Add New Property"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? "Update your property listing details" : "Create a new property listing for the marketplace"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="description">Description</Label>
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
                    {KENYAN_COUNTIES.map((c) => (
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
          </CardContent>
        </Card>

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
                  <span className={selectedAmenities.includes(amenity.key) ? "text-foreground font-medium" : "text-muted-foreground"}>
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
                    <Badge key={key} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleAmenity(key)}>
                      {amenity?.label || key}
                      <span className="ml-0.5">×</span>
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/properties">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-secondary hover:bg-orange-dark text-secondary-foreground">
            {isSubmitting ? (
              <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isEditing ? "Saving…" : "Publishing…"}</span>
            ) : (
              <span className="flex items-center gap-2"><Save className="h-4 w-4" />{isEditing ? "Save Changes" : "Publish Listing"}</span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
