import { useState } from "react";
import { User, Camera, Lock, Bell, Shield, Save, Eye, EyeOff, Trash2, FileText, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DOCS = [
  { id: "national-id", label: "National ID", status: "Verified", filename: "national_id.jpg" },
  { id: "payslip", label: "Payslip", status: "Verified", filename: "payslip_may2024.pdf" },
  { id: "bank-statement", label: "Bank Statement", status: "Uploaded", filename: "bank_stmt_q2.pdf" },
  { id: "reference", label: "Reference Letter", status: "Not Uploaded", filename: "" },
];

const docStatusColors: Record<string, string> = {
  Verified: "bg-green-100 text-green-700",
  Uploaded: "bg-yellow-100 text-yellow-700",
  "Not Uploaded": "bg-gray-100 text-gray-500",
};

const TABS = ["Profile", "Security", "Documents", "Notifications"] as const;

export default function TenantProfile() {
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("Profile");
  const [saving, setSaving] = useState(false);

  // Profile
  const [name, setName] = useState("James Mwangi");
  const [email, setEmail] = useState("james.mwangi@gmail.com");
  const [phone, setPhone] = useState("+254 712 345 678");
  const [bio, setBio] = useState("Software Engineer based in Nairobi. Looking for a quiet 2-bedroom in Kilimani or Lavington.");
  const [occupation, setOccupation] = useState("Software Engineer");
  const [employer, setEmployer] = useState("Safaricom PLC");

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    paymentReminders: true,
    viewingConfirmations: true,
    agentReplies: true,
    propertyAlerts: true,
    priceDrops: false,
    newListings: false,
    marketingEmails: false,
  });

  function save() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast({ title: "Changes saved successfully" });
    }, 1000);
  }

  function savePassword() {
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPw.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast({ title: "Password updated successfully" });
    }, 1000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details, security, and preferences.</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-heading font-bold text-2xl">
            JM
          </div>
          <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div>
          <p className="font-semibold font-heading">{name}</p>
          <p className="text-sm text-muted-foreground">{email}</p>
          <Badge className="mt-1 bg-green-100 text-green-700 border-0 text-xs">Verified Tenant</Badge>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex border-b">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5",
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t === "Profile" && <User className="h-3.5 w-3.5" />}
            {t === "Security" && <Lock className="h-3.5 w-3.5" />}
            {t === "Documents" && <FileText className="h-3.5 w-3.5" />}
            {t === "Notifications" && <Bell className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "Profile" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email Address</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone Number</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Occupation</Label>
              <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Employer</Label>
              <Input value={employer} onChange={(e) => setEmployer(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="resize-none text-sm" placeholder="Tell landlords about yourself…" />
          </div>
          <Button onClick={save} disabled={saving} className="bg-secondary hover:bg-secondary/90">
            {saving ? <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</span> : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
          </Button>
        </div>
      )}

      {/* Security Tab */}
      {tab === "Security" && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Lock className="h-4 w-4" />Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Password</Label>
                <div className="relative">
                  <Input type={showPw ? "text" : "password"} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} className="pr-10" />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Minimum 8 characters" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirm New Password</Label>
                <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
              </div>
              <Button onClick={savePassword} disabled={saving || !currentPw || !newPw} className="bg-secondary hover:bg-secondary/90">
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-destructive flex items-center gap-2"><Shield className="h-4 w-4" />Danger Zone</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">Permanently delete your account and all associated data. This action cannot be undone.</p>
              <Button variant="destructive" size="sm" onClick={() => toast({ title: "Please contact support to delete your account.", variant: "destructive" })}>
                <Trash2 className="h-4 w-4 mr-2" />Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents Tab */}
      {tab === "Documents" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Verified documents help landlords and agents trust you faster.</p>
          {DOCS.map((doc) => (
            <Card key={doc.id} className={cn("border", doc.status === "Verified" && "border-green-200 bg-green-50/30")}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    doc.status === "Verified" ? "bg-green-100" : doc.status === "Uploaded" ? "bg-yellow-100" : "bg-muted"
                  )}>
                    {doc.status === "Verified" ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{doc.label}</p>
                    {doc.filename && <p className="text-xs text-muted-foreground">{doc.filename}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", docStatusColors[doc.status])}>{doc.status}</span>
                  {doc.status === "Not Uploaded" ? (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => toast({ title: "Upload feature", description: "Upload your " + doc.label })}>
                      Upload
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => toast({ title: "Re-upload", description: doc.label })}>
                      Re-upload
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notifications Tab */}
      {tab === "Notifications" && (
        <div className="space-y-5">
          {[
            { key: "paymentReminders", label: "Rent payment reminders", desc: "Get notified before your rent is due" },
            { key: "viewingConfirmations", label: "Viewing confirmations", desc: "Confirmation when a viewing is approved or cancelled" },
            { key: "agentReplies", label: "Agent replies", desc: "When an agent responds to your inquiry or message" },
            { key: "propertyAlerts", label: "Property status alerts", desc: "When a saved property becomes unavailable or changes" },
            { key: "priceDrops", label: "Price drops", desc: "When a saved property drops in price" },
            { key: "newListings", label: "New listings", desc: "New properties matching your preferences" },
            { key: "marketingEmails", label: "Marketing emails", desc: "Tips, property guides and platform news" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifPrefs[item.key as keyof typeof notifPrefs]}
                onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
          <Button onClick={save} disabled={saving} className="bg-secondary hover:bg-secondary/90">
            <Save className="h-4 w-4 mr-2" />Save Preferences
          </Button>
        </div>
      )}
    </div>
  );
}
