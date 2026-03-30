import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, getApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  ArrowRight,
  User,
  MapPin,
  FileText,
  CheckCircle2,
  Upload,
  Home,
  Briefcase,
  Heart,
  Camera,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const STEPS = [
  { label: "Profile", icon: User },
  { label: "Preferences", icon: Heart },
  { label: "Documents", icon: FileText },
  { label: "Complete", icon: CheckCircle2 },
];

import { useCounties } from "@/hooks/useCounties";

const AMENITIES = [
  "Parking", "Swimming Pool", "Gym", "Security", "Garden",
  "Balcony", "WiFi", "Water Tank", "Generator", "Elevator",
  "Laundry", "Pet Friendly",
];

const DOCUMENT_TYPES = [
  { id: "national-id", label: "National ID / Passport", description: "Government-issued photo identification", required: true },
  { id: "payslip", label: "Recent Payslip", description: "Last 3 months employment proof", required: true },
  { id: "bank-statement", label: "Bank Statement", description: "Last 3 months financial records", required: false },
  { id: "reference", label: "Reference Letter", description: "From previous landlord or employer", required: false },
];

export default function TenantOnboarding() {
  const navigate = useNavigate();
  const { data: counties = [] } = useCounties();
  const countyNames = counties.map(c => c.name);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Profile
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employer, setEmployer] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Preferences
  const [preferredCounty, setPreferredCounty] = useState("");
  const [preferredAreas, setPreferredAreas] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Documents
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const handlePhotoUpload = () => {
    setProfilePhoto("/placeholder.svg");
    toast.success("Profile photo uploaded");
  };

  const handleDocUpload = (docId: string) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: `${docId}-uploaded.pdf` }));
    toast.success("Document uploaded successfully");
  };

  const removeDoc = (docId: string) => {
    setUploadedDocs((prev) => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
  };

  const canNext = () => {
    if (step === 0) return occupation && monthlyIncome;
    if (step === 1) return preferredCounty && propertyType && budgetMin;
    if (step === 2) return uploadedDocs["national-id"] && uploadedDocs["payslip"];
    return true;
  };

  const handleNext = () => {
    if (!canNext()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await api.put("/auth/me", { occupation, employer, bio: bio || undefined });
      toast.success("Onboarding complete! Welcome to Dwelly Homes.");
      navigate("/tenant");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">Dwelly Homes</span>
          </Link>
          <span className="text-sm text-muted-foreground font-body">Step {step + 1} of {STEPS.length}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicators */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isComplete = i < step;
              const isCurrent = i === step;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      isComplete
                        ? "bg-success text-success-foreground"
                        : isCurrent
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-body ${isCurrent ? "text-secondary font-semibold" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-1.5 [&>div]:bg-secondary" />
        </div>

        {/* Step 0 — Profile */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Complete Your Profile</h1>
              <p className="text-muted-foreground font-body mt-1">Help landlords know more about you.</p>
            </div>

            {/* Photo */}
            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-secondary transition-colors"
                onClick={handlePhotoUpload}
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-body font-medium text-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground font-body">Click to upload (optional)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body">About You</Label>
              <Textarea
                placeholder="Tell landlords a bit about yourself..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">
                  Occupation <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="e.g. Software Engineer" value={occupation} onChange={(e) => setOccupation(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Employer</Label>
                <Input placeholder="Company name" value={employer} onChange={(e) => setEmployer(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body">
                Monthly Income (KES) <span className="text-destructive">*</span>
              </Label>
              <Select value={monthlyIncome} onValueChange={setMonthlyIncome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select income range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below-50k">Below KES 50,000</SelectItem>
                  <SelectItem value="50k-100k">KES 50,000 – 100,000</SelectItem>
                  <SelectItem value="100k-200k">KES 100,000 – 200,000</SelectItem>
                  <SelectItem value="200k-500k">KES 200,000 – 500,000</SelectItem>
                  <SelectItem value="above-500k">Above KES 500,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 1 — Preferences */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Rental Preferences</h1>
              <p className="text-muted-foreground font-body mt-1">We'll match you with properties that fit your needs.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">
                  Preferred County <span className="text-destructive">*</span>
                </Label>
                <Select value={preferredCounty} onValueChange={setPreferredCounty}>
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
              <div className="space-y-2">
                <Label className="font-body">Preferred Areas</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="e.g. Kilimani, Westlands" value={preferredAreas} onChange={(e) => setPreferredAreas(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="font-body">
                  Property Type <span className="text-destructive">*</span>
                </Label>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="studio">Studio</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="bedsitter">Bedsitter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Bedrooms</Label>
                <Select value={bedrooms} onValueChange={setBedrooms}>
                  <SelectTrigger>
                    <SelectValue placeholder="Beds" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Bedroom</SelectItem>
                    <SelectItem value="2">2 Bedrooms</SelectItem>
                    <SelectItem value="3">3 Bedrooms</SelectItem>
                    <SelectItem value="4">4+ Bedrooms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Move-in Date</Label>
                <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">
                  Min Budget (KES) <span className="text-destructive">*</span>
                </Label>
                <Input type="number" placeholder="e.g. 25000" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="font-body">Max Budget (KES)</Label>
                <Input type="number" placeholder="e.g. 80000" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="font-body">Preferred Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                    className={`cursor-pointer transition-all font-body ${
                      selectedAmenities.includes(amenity)
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : "hover:border-secondary hover:text-secondary"
                    }`}
                    onClick={() => toggleAmenity(amenity)}
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Documents */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Upload Documents</h1>
              <p className="text-muted-foreground font-body mt-1">
                Verified tenants get faster responses from landlords.
              </p>
            </div>

            <div className="space-y-4">
              {DOCUMENT_TYPES.map((doc) => {
                const isUploaded = !!uploadedDocs[doc.id];
                return (
                  <Card key={doc.id} className={`transition-all ${isUploaded ? "border-success/50 bg-success/5" : ""}`}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isUploaded ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                          {isUploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-medium text-foreground text-sm">
                            {doc.label}
                            {doc.required && <span className="text-destructive ml-1">*</span>}
                          </p>
                          <p className="text-xs text-muted-foreground font-body truncate">{doc.description}</p>
                        </div>
                      </div>
                      {isUploaded ? (
                        <Button variant="ghost" size="icon" onClick={() => removeDoc(doc.id)} className="shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocUpload(doc.id)}
                          className="shrink-0 font-body"
                        >
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-body text-sm text-muted-foreground">
                Drag & drop files here or click upload buttons above
              </p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 5MB each</p>
            </div>
          </div>
        )}

        {/* Step 3 — Complete */}
        {step === 3 && (
          <div className="text-center space-y-6 py-8">
            <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">You're All Set!</h1>
              <p className="text-muted-foreground font-body mt-2 max-w-md mx-auto">
                Your profile is complete. You'll now receive personalized property recommendations
                matching your preferences in {preferredCounty || "your area"}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-secondary">{selectedAmenities.length}</p>
                  <p className="text-xs text-muted-foreground font-body">Amenities</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-secondary">
                    {Object.keys(uploadedDocs).length}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">Documents</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-secondary">
                    {budgetMin ? `${(Number(budgetMin) / 1000).toFixed(0)}K` : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground font-body">Min Budget</p>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={handleComplete}
              disabled={loading}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body px-8"
              size="lg"
            >
              {loading ? "Setting up…" : "Go to Dashboard"}
            </Button>
          </div>
        )}

        {/* Navigation */}
        {step < 3 && (
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="font-body">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canNext()}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body"
            >
              {step === 2 ? "Complete Setup" : <>Next <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
