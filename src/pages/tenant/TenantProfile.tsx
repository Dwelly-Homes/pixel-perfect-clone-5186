import { useState, useEffect } from "react";
import { User, Camera, Lock, Bell, Shield, Save, Eye, EyeOff, Trash2, FileText, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  occupation: string | null;
  employer: string | null;
  bio: string | null;
  isPhoneVerified: boolean;
  notificationPreferences: {
    inquiry: boolean;
    verification: boolean;
    property: boolean;
    payment: boolean;
    earb: boolean;
    system: boolean;
  };
}

const TABS = ["Profile", "Security", "Notifications"] as const;

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TenantProfile() {
  const { toast } = useToast();
  const { user: authUser, setAuth } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("Profile");

  // ── Fetch profile ──
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["myProfile"],
    queryFn: async () => {
      const { data } = await api.get("/auth/me");
      return data?.data as UserProfile;
    },
  });

  // ── Profile form state ──
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employer, setEmployer] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profile) {
      setName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
      setOccupation(profile.occupation ?? "");
      setEmployer(profile.employer ?? "");
      setBio(profile.bio ?? "");
    }
  }, [profile]);

  // ── Save profile ──
  const saveProfile = useMutation({
    mutationFn: () =>
      api.patch("/auth/me", { fullName: name, occupation, employer, bio }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      // Update auth context if name changed
      if (authUser && res.data?.data) {
        const updated = res.data.data;
        const stored = JSON.parse(localStorage.getItem("user") ?? "{}");
        const merged = { ...stored, fullName: updated.fullName };
        localStorage.setItem("user", JSON.stringify(merged));
      }
      toast({ title: "Profile saved successfully" });
    },
    onError: () => toast({ title: "Failed to save profile", variant: "destructive" }),
  });

  // ── Security ──
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);

  const changePassword = useMutation({
    mutationFn: () =>
      api.post("/auth/change-password", { currentPassword: currentPw, newPassword: newPw }),
    onSuccess: () => {
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast({ title: "Password changed successfully" });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to change password";
      toast({ title: msg, variant: "destructive" });
    },
  });

  function handleChangePassword() {
    if (newPw !== confirmPw) {
      toast({ title: "Passwords don't match", variant: "destructive" }); return;
    }
    if (newPw.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" }); return;
    }
    changePassword.mutate();
  }

  // ── Notification preferences ──
  const [notifPrefs, setNotifPrefs] = useState({
    inquiry: true, verification: true, property: true,
    payment: true, earb: true, system: true,
  });

  useEffect(() => {
    if (profile?.notificationPreferences) {
      setNotifPrefs(profile.notificationPreferences);
    }
  }, [profile]);

  const saveNotifPrefs = useMutation({
    mutationFn: () => api.patch("/notifications/preferences", notifPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      toast({ title: "Notification preferences saved" });
    },
    onError: () => toast({ title: "Failed to save preferences", variant: "destructive" }),
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account details, security, and preferences.</p>
      </div>

      {/* Avatar */}
      {isLoading ? (
        <div className="flex items-center gap-5">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-heading font-bold text-2xl">
              {initials(profile?.fullName)}
            </div>
            <button className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow hover:bg-primary/90">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <p className="font-semibold font-heading">{profile?.fullName ?? "—"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email ?? "—"}</p>
            {profile?.isPhoneVerified && (
              <Badge className="mt-1 bg-green-100 text-green-700 border-0 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />Verified
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex border-b overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 whitespace-nowrap shrink-0",
              tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {t === "Profile"       && <User className="h-3.5 w-3.5" />}
            {t === "Security"      && <Lock className="h-3.5 w-3.5" />}
            {t === "Notifications" && <Bell className="h-3.5 w-3.5" />}
            {t}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === "Profile" && (
        <div className="space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email Address</Label>
                  <Input value={profile?.email ?? ""} disabled className="bg-muted" />
                  <p className="text-[10px] text-muted-foreground">Email cannot be changed here.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone Number</Label>
                  <Input value={phone} disabled className="bg-muted" />
                  <p className="text-[10px] text-muted-foreground">Phone cannot be changed here.</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Occupation</Label>
                  <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Software Engineer" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Employer</Label>
                  <Input value={employer} onChange={(e) => setEmployer(e.target.value)} placeholder="e.g. Safaricom PLC" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bio</Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                  placeholder="Tell landlords a bit about yourself…"
                  maxLength={500}
                />
                <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
              </div>
              <Button
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending}
                className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto"
              >
                {saveProfile.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  : <><Save className="h-4 w-4 mr-2" />Save Changes</>}
              </Button>
            </>
          )}
        </div>
      )}

      {/* ── Security Tab ── */}
      {tab === "Security" && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />Change Password
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <Input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={changePassword.isPending || !currentPw || !newPw || !confirmPw}
                className="bg-secondary hover:bg-secondary/90"
              >
                {changePassword.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating…</>
                  : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <Shield className="h-4 w-4" />Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => toast({ title: "Please contact support to delete your account.", variant: "destructive" })}
              >
                <Trash2 className="h-4 w-4 mr-2" />Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Notifications Tab ── */}
      {tab === "Notifications" && (
        <div className="space-y-5">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            ))
          ) : (
            <>
              {([
                { key: "inquiry",      label: "Inquiry notifications",    desc: "When an agent responds to your inquiry" },
                { key: "property",     label: "Property updates",         desc: "When a saved property changes or becomes unavailable" },
                { key: "payment",      label: "Payment reminders",        desc: "Upcoming rent and payment due reminders" },
                { key: "verification", label: "Verification updates",     desc: "Status changes on your account verification" },
                { key: "system",       label: "System notifications",     desc: "Platform updates, tips and announcements" },
              ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifPrefs[item.key]}
                    onCheckedChange={(v) => setNotifPrefs((p) => ({ ...p, [item.key]: v }))}
                  />
                </div>
              ))}
              <Button
                onClick={() => saveNotifPrefs.mutate()}
                disabled={saveNotifPrefs.isPending}
                className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto"
              >
                {saveNotifPrefs.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                  : <><Save className="h-4 w-4 mr-2" />Save Preferences</>}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
