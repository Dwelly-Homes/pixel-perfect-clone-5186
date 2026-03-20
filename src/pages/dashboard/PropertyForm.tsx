import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Upload, X, Save, Eye } from "lucide-react";
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
import { mockProperties, KENYAN_COUNTIES, PROPERTY_TYPES, AMENITIES_LIST } from "@/data/properties";
import { toast } from "sonner";

export default function PropertyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const existing = isEditing ? mockProperties.find((p) => p.id === id) : null;

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [type, setType] = useState(existing?.type ?? "");
  const [bedrooms, setBedrooms] = useState(String(existing?.bedrooms ?? ""));
  const [price, setPrice] = useState(String(existing?.price ?? ""));
  const [neighborhood, setNeighborhood] = useState(existing?.location.neighborhood ?? "");
  const [county, setCounty] = useState(existing?.location.county ?? "");
  const [status, setStatus] = useState(existing?.status ?? "available");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(existing?.amenities ?? []);
  const [images] = useState<string[]>(existing?.images ?? []);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !type || !price || !neighborhood || !county) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(isEditing ? "Property updated successfully!" : "Property created successfully!");
    navigate("/dashboard/properties");
  };

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
        {/* Basic Info */}
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
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Property Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPERTY_TYPES.filter((t) => t !== "All").map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0"
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="under-maintenance">Under Maintenance</SelectItem>
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
                    {KENYAN_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Monthly Rent (KES) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  KES
                </span>
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
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Amenities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {AMENITIES_LIST.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground transition-colors"
                >
                  <Checkbox
                    checked={selectedAmenities.includes(amenity)}
                    onCheckedChange={() => toggleAmenity(amenity)}
                  />
                  <span className={selectedAmenities.includes(amenity) ? "text-foreground font-medium" : "text-muted-foreground"}>
                    {amenity}
                  </span>
                </label>
              ))}
            </div>
            {selectedAmenities.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selectedAmenities.map((a) => (
                  <Badge key={a} variant="secondary" className="gap-1 cursor-pointer" onClick={() => toggleAmenity(a)}>
                    {a}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Photos */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Photos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group aspect-[4/3] rounded-lg overflow-hidden border">
                  <img src={img} alt={`Property photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-foreground/60 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => toast.info("Photo upload requires Lovable Cloud")}
                className="aspect-[4/3] rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-secondary hover:text-secondary transition-colors"
              >
                <Upload className="h-6 w-6" />
                <span className="text-xs font-medium">Add Photo</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/properties">Cancel</Link>
          </Button>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button type="button" variant="outline" className="flex-1 sm:flex-initial" onClick={() => toast.info("Preview coming soon")}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button type="submit" className="flex-1 sm:flex-initial bg-secondary hover:bg-orange-dark text-secondary-foreground">
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Save Changes" : "Publish Listing"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
