import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface InviteInfo {
  email: string;
  fullName: string;
  role: string;
  tenantName?: string;
}

export default function InviteAccept() {
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    api.get(`/users/invitations/validate?token=${token}`)
      .then(({ data }) => {
        setInvite(data.data);
        setForm((f) => ({ ...f, name: data.data.fullName || "" }));
        setTokenValid(true);
      })
      .catch(() => setTokenValid(false));
  }, [token]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().split(" ").filter(Boolean).length < 2)
      errs.name = "Please enter your full name (at least 2 words).";
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters.";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match.";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/users/invitations/accept", {
        token,
        fullName: form.name,
        password: form.password,
      });
      if (data.data?.accessToken) {
        setAuth(data.data.user, data.data.accessToken, data.data.refreshToken);
      }
      toast.success("Account created! Welcome to Dwelly Homes.");
      navigate("/dashboard");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-heading font-bold">Invitation Expired</h1>
          <p className="text-muted-foreground text-sm">This invitation link has expired or is no longer valid.</p>
          <Button asChild variant="outline">
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-2/5 bg-primary flex-col items-center justify-center p-12 text-primary-foreground">
        <div className="text-center space-y-4 max-w-xs">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto text-white font-heading font-bold text-2xl">D</div>
          <h1 className="text-3xl font-heading font-bold">Dwelly Homes</h1>
          <p className="text-primary-foreground/70 text-sm">Kenya's Trusted Property Marketplace</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-heading font-bold">D</div>
            <span className="font-heading font-semibold text-lg">Dwelly Homes</span>
          </div>

          {invite && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-800">
                You have been invited to join <strong>{invite.tenantName || "Dwelly Homes"}</strong> as <strong>{invite.role}</strong>.
              </p>
            </div>
          )}

          <div>
            <h2 className="text-2xl font-heading font-bold">Accept Invitation</h2>
            <p className="text-sm text-muted-foreground mt-1">Create your account to get started.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email Address</Label>
              <Input value={invite?.email || ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  className="pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-secondary hover:bg-secondary/90 h-11">
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating Account…</span>
              ) : "Accept & Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-secondary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
