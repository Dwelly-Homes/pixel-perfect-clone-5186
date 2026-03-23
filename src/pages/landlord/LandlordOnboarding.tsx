import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  CheckCircle2,
  Upload,
  Home,
  User,
  Phone,
  Mail,
  MapPin,
  Plus,
  X,
  Camera,
  Briefcase,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { label: "Profile", icon: User },
  { label: "Portfolio", icon: Building2 },
  { label: "Verification", icon: Shield },
  { label: "Complete", icon: CheckCircle2 },
];

const KENYAN_COUNTIES = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu",
  "Machakos", "Kajiado", "Uasin Gishu", "Kilifi", "Nyeri",
];

const PROPERTY_TYPES = ["Apartment", "House", "Townhouse", "Studio", "Bedsitter", "Commercial"];

const VERIFICATION_DOCS = [
  { id: "national-id", label: "National ID / Passport", description: "Government-issued photo identification", required: true },
  { id: "kra-pin", label: "KRA PIN Certificate", description: "Tax compliance certificate", required: true },
  { id: "title-deed", label: "Title Deed / Lease Agreement", description: "Proof of property ownership or management authority", required: true },
  { id: "business-reg", label: "Business Registration", description: "CR12 or business permit (if applicable)", required: false },
  { id: "tax-compliance", label: "Tax Compliance Certificate", description: "Current KRA compliance certificate", required: false },
];

interface PortfolioProperty {
  id: string;
  name: string;
  type: string;
  county: string;
  area: string;
  units: string;
  monthlyRent: string;
}

export default function LandlordOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Profile
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");

  // Portfolio
  const [properties, setProperties] = useState<PortfolioProperty[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProp, setNewProp] = useState<Omit<PortfolioProperty, "id">>({
    name: "", type: "", county: "", area: "", units: "", monthlyRent: "",
  });

  // Verification
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, string>>({});

  const progress = ((step + 1) / STEPS.length) * 100;

  const addProperty = () => {
    if (!newProp.name || !newProp.type || !newProp.county) {
      toast.error("Please fill in property name, type, and county");
      return;
    }
    setProperties((prev) => [...prev, { ...newProp, id: crypto.randomUUID() }]);
    setNewProp({ name: "", type: "", county: "", area: "", units: "", monthlyRent: "" });
    setShowAddForm(false);
    toast.success("Property added to portfolio");
  };

  const removeProperty = (id: string) => setProperties((prev) => prev.filter((p) => p.id !== id));

  const handleDocUpload = (docId: string) => {
    setUploadedDocs((prev) => ({ ...prev, [docId]: `${docId}-uploaded.pdf` }));
    toast.success("Document uploaded successfully");
  };

  const removeDoc = (docId: string) => {
    setUploadedDocs((prev) => { const n = { ...prev }; delete n[docId]; return n; });
  };

  const canNext = () => {
    if (step === 0) return businessType && yearsExperience;
    if (step === 1) return properties.length > 0;
    if (step === 2) return uploadedDocs["national-id"] && uploadedDocs["kra-pin"] && uploadedDocs["title-deed"];
    return true;
  };

  const handleNext = () => {
    if (!canNext()) { toast.error("Please complete all required fields"); return; }
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const handleComplete = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Welcome aboard! Your landlord profile is ready.");
      navigate("/landlord");
    }, 1200);
  };

  const totalUnits = properties.reduce((sum, p) => sum + (parseInt(p.units) || 0), 0);
  const totalRent = properties.reduce((sum, p) => sum + (parseInt(p.monthlyRent) || 0), 0);

  return (
    <div className="min-h-screen bg-background">
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
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                    isComplete ? "bg-success text-success-foreground" : isCurrent ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-body ${isCurrent ? "text-secondary font-semibold" : "text-muted-foreground"}`}>{s.label}</span>
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
              <h1 className="font-heading text-2xl font-bold text-foreground">Landlord Profile</h1>
              <p className="text-muted-foreground font-body mt-1">Set up your business profile so tenants can trust you.</p>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-secondary transition-colors"
                onClick={() => { setProfilePhoto("/placeholder.svg"); toast.success("Photo uploaded"); }}
              >
                {profilePhoto ? <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" /> : <Camera className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-body font-medium text-foreground">Profile / Company Logo</p>
                <p className="text-xs text-muted-foreground font-body">Click to upload (optional)</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-body">Company / Business Name</Label>
              <Input placeholder="e.g. Mwangi Properties Ltd" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label className="font-body">About Your Business</Label>
              <Textarea placeholder="Describe your property management experience..." value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">Business Type <span className="text-destructive">*</span></Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual Landlord</SelectItem>
                    <SelectItem value="company">Property Company</SelectItem>
                    <SelectItem value="agent">Managing Agent</SelectItem>
                    <SelectItem value="sacco">SACCO / Cooperative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Years of Experience <span className="text-destructive">*</span></Label>
                <Select value={yearsExperience} onValueChange={setYearsExperience}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1">Less than 1 year</SelectItem>
                    <SelectItem value="1-3">1–3 years</SelectItem>
                    <SelectItem value="3-5">3–5 years</SelectItem>
                    <SelectItem value="5-10">5–10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-body">Business Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="tel" placeholder="+254 712 345 678" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Business Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" type="email" placeholder="info@company.co.ke" value={businessEmail} onChange={(e) => setBusinessEmail(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1 — Portfolio */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Property Portfolio</h1>
              <p className="text-muted-foreground font-body mt-1">Add your properties so we can set up your dashboard.</p>
            </div>

            {properties.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-2">
                <Card><CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-secondary">{properties.length}</p>
                  <p className="text-xs text-muted-foreground font-body">Properties</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold font-heading text-secondary">{totalUnits || "—"}</p>
                  <p className="text-xs text-muted-foreground font-body">Total Units</p>
                </CardContent></Card>
              </div>
            )}

            {/* Property List */}
            <div className="space-y-3">
              {properties.map((prop) => (
                <Card key={prop.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-body font-semibold text-sm text-foreground truncate">{prop.name}</p>
                        <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {prop.area ? `${prop.area}, ` : ""}{prop.county}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-body text-xs">{prop.type}</Badge>
                      {prop.monthlyRent && <span className="text-xs font-bold text-secondary font-body">KES {parseInt(prop.monthlyRent).toLocaleString()}</span>}
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeProperty(prop.id)}><X className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Add Property Form */}
            {showAddForm ? (
              <Card className="border-secondary/30">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-heading font-semibold text-foreground">Add Property</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-body text-xs">Property Name *</Label>
                      <Input placeholder="e.g. Sunset Apartments" value={newProp.name} onChange={(e) => setNewProp({ ...newProp, name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body text-xs">Type *</Label>
                      <Select value={newProp.type} onValueChange={(v) => setNewProp({ ...newProp, type: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body text-xs">County *</Label>
                      <Select value={newProp.county} onValueChange={(v) => setNewProp({ ...newProp, county: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>{KENYAN_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body text-xs">Area / Neighborhood</Label>
                      <Input placeholder="e.g. Kilimani" value={newProp.area} onChange={(e) => setNewProp({ ...newProp, area: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body text-xs">Number of Units</Label>
                      <Input type="number" placeholder="e.g. 24" value={newProp.units} onChange={(e) => setNewProp({ ...newProp, units: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="font-body text-xs">Avg Monthly Rent (KES)</Label>
                      <Input type="number" placeholder="e.g. 45000" value={newProp.monthlyRent} onChange={(e) => setNewProp({ ...newProp, monthlyRent: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddForm(false)} className="font-body">Cancel</Button>
                    <Button onClick={addProperty} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body">Add Property</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Button variant="outline" onClick={() => setShowAddForm(true)} className="w-full border-dashed font-body">
                <Plus className="h-4 w-4 mr-2" /> Add Property
              </Button>
            )}
          </div>
        )}

        {/* Step 2 — Verification */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="font-heading text-2xl font-bold text-foreground">Verification Documents</h1>
              <p className="text-muted-foreground font-body mt-1">Verified landlords get 3× more tenant inquiries.</p>
            </div>
            <div className="space-y-4">
              {VERIFICATION_DOCS.map((doc) => {
                const isUploaded = !!uploadedDocs[doc.id];
                return (
                  <Card key={doc.id} className={`transition-all ${isUploaded ? "border-success/50 bg-success/5" : ""}`}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isUploaded ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                          {isUploaded ? <CheckCircle2 className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-medium text-foreground text-sm">{doc.label}{doc.required && <span className="text-destructive ml-1">*</span>}</p>
                          <p className="text-xs text-muted-foreground font-body truncate">{doc.description}</p>
                        </div>
                      </div>
                      {isUploaded ? (
                        <Button variant="ghost" size="icon" onClick={() => removeDoc(doc.id)} className="shrink-0"><X className="h-4 w-4" /></Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => handleDocUpload(doc.id)} className="shrink-0 font-body"><Upload className="h-4 w-4 mr-1" /> Upload</Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="font-body text-sm text-muted-foreground">Drag & drop files here or click upload buttons above</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10MB each</p>
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
              <h1 className="font-heading text-2xl font-bold text-foreground">Welcome to Dwelly!</h1>
              <p className="text-muted-foreground font-body mt-2 max-w-md mx-auto">
                Your landlord profile is set up with {properties.length} {properties.length === 1 ? "property" : "properties"}.
                You can now manage listings, track rent, and connect with tenants.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-heading text-secondary">{properties.length}</p>
                <p className="text-xs text-muted-foreground font-body">Properties</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-heading text-secondary">{totalUnits || "—"}</p>
                <p className="text-xs text-muted-foreground font-body">Total Units</p>
              </CardContent></Card>
              <Card><CardContent className="p-4 text-center">
                <p className="text-2xl font-bold font-heading text-secondary">{Object.keys(uploadedDocs).length}</p>
                <p className="text-xs text-muted-foreground font-body">Documents</p>
              </CardContent></Card>
            </div>
            <Button onClick={handleComplete} disabled={loading} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body px-8" size="lg">
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
            <Button onClick={handleNext} disabled={!canNext()} className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body">
              {step === 2 ? "Complete Setup" : <>Next <ArrowRight className="h-4 w-4 ml-1" /></>}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
