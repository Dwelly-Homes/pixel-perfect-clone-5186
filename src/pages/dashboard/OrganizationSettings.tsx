import { useState } from "react";
import { Building2, MapPin, Phone, Mail, Globe, Camera, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const NAIROBI_AREAS = ["Westlands", "Kilimani", "Lavington", "Karen", "Runda", "Muthaiga", "Gigiri", "Langata", "Parklands", "Eastleigh", "South B", "South C", "Kasarani", "Ruaka", "Thika Road"];

export default function OrganizationSettings() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "Prestige Properties Ltd",
    tagline: "Your trusted partner in Nairobi real estate",
    phone: "+254 712 345 678",
    email: "info@prestigeproperties.co.ke",
    website: "www.prestigeproperties.co.ke",
    address: "Westlands Business Park, Nairobi",
    area: "Westlands",
    description: "Prestige Properties Ltd is a licensed real estate agency operating in Nairobi since 2015. We specialize in residential and commercial property lettings across prime Nairobi neighborhoods.",
    commissionRate: "5",
  });

  function set(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast({ title: "Organization name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Settings saved", description: "Your organization profile has been updated." });
    }, 1200);
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Organization Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your agency's public profile and preferences.</p>
      </div>

      {/* Logo & Name */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Building2 className="h-4 w-4" />Agency Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center cursor-pointer shadow">
                <Camera className="h-3 w-3" />
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-xs font-medium">Agency Logo</p>
              <p className="text-xs text-muted-foreground">PNG or JPG, minimum 200×200px. This appears on your public listings.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name" className="text-xs">Organization Name <span className="text-destructive">*</span></Label>
              <Input id="org-name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-tagline" className="text-xs">Tagline</Label>
              <Input id="org-tagline" value={form.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. Your trusted partner in real estate" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-desc" className="text-xs">Description</Label>
            <Textarea id="org-desc" value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className="resize-none text-sm" placeholder="Tell tenants and landlords about your agency…" />
          </div>
        </CardContent>
      </Card>

      {/* Contact Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-phone" className="text-xs">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="org-phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="pl-8" placeholder="+254 7XX XXX XXX" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-email" className="text-xs">Business Email</Label>
              <div className="relative">
                <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="org-email" value={form.email} onChange={(e) => set("email", e.target.value)} className="pl-8" placeholder="info@yourcompany.co.ke" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-website" className="text-xs">Website</Label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input id="org-website" value={form.website} onChange={(e) => set("website", e.target.value)} className="pl-8" placeholder="www.yourcompany.co.ke" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-area" className="text-xs">Primary Area of Operation</Label>
              <Select value={form.area} onValueChange={(v) => set("area", v)}>
                <SelectTrigger id="org-area">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NAIROBI_AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="org-address" className="text-xs">Physical Address</Label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input id="org-address" value={form.address} onChange={(e) => set("address", e.target.value)} className="pl-8" placeholder="Building name, area, Nairobi" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Preferences */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Commission Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 max-w-xs">
            <Label htmlFor="commission-rate" className="text-xs">Default Commission Rate (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              min={1}
              max={20}
              value={form.commissionRate}
              onChange={(e) => set("commissionRate", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Applied to new tenancy move-ins. Can be overridden per property.</p>
          </div>
        </CardContent>
      </Card>

      <Button className="bg-secondary hover:bg-secondary/90 h-10 px-6" onClick={handleSave} disabled={saving}>
        {saving ? (
          <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span>
        ) : (
          <><Save className="h-4 w-4 mr-2" />Save Changes</>
        )}
      </Button>
    </div>
  );
}
