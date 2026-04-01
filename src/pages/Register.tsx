import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, ArrowRight, Home, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { completeGoogleAuth } from "@/lib/googleAuth";

type AccountType = "tenant" | "landlord" | "agent";

interface FormData {
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

const accountTypes: { value: AccountType; label: string; description: string; icon: React.ElementType }[] = [
  { value: "tenant", label: "Tenant", description: "Looking for a place to rent or buy", icon: Home },
  { value: "landlord", label: "Landlord", description: "I own property to list", icon: Building2 },
  { value: "agent", label: "Agent", description: "I manage properties for clients", icon: Briefcase },
];

const STEPS = ["Account Type", "Personal Info", "Security"];

export default function Register() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<FormData>({
    accountType: "tenant",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const set = (key: keyof FormData, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return form.firstName && form.lastName && form.email && form.phone;
    if (step === 2) return form.password.length >= 8 && form.password === form.confirmPassword;
    return false;
  };

  // Map frontend account type labels to backend AccountType enum values
  const accountTypeMap: Record<AccountType, string> = {
    tenant: "searcher",
    landlord: "landlord",
    agent: "estate_agent",
  };

  const navigateForUser = (role: string) => {
    if (role === "platform_admin") navigate("/admin");
    else if (role === "searcher") navigate("/tenant");
    else navigate("/dashboard");
  };

  const handleSubmit = async () => {
    if (!canNext()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", {
        fullName: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        password: form.password,
        accountType: accountTypeMap[form.accountType],
      });
      toast.success("Account created! Please verify your phone number.");
      navigate("/verify-otp", { state: { phone: data.data.phone, email: form.email } });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const { accessToken, refreshToken, user } = await completeGoogleAuth(credential, accountTypeMap[form.accountType] as "searcher" | "landlord" | "estate_agent");
      setAuth(user, accessToken, refreshToken);
      toast.success("Welcome to Dwelly Homes!");
      navigateForUser(user.role);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Join Dwelly Homes" subtitle="Create your account and start your property journey in Kenya.">
      <div className="space-y-6">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">Dwelly Homes</span>
          </Link>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Create account</h2>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Already have an account?{" "}
            <Link to="/login" className="text-secondary hover:text-orange-dark font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-body text-muted-foreground">
            {STEPS.map((s, i) => (
              <span key={s} className={i <= step ? "text-secondary font-medium" : ""}>
                {s}
              </span>
            ))}
          </div>
          <Progress value={progress} className="h-1.5 [&>div]:bg-secondary" />
        </div>

        {/* Step 0: Account Type */}
        {step === 0 && (
          <RadioGroup
            value={form.accountType}
            onValueChange={(v) => set("accountType", v)}
            className="space-y-3"
          >
            {accountTypes.map((t) => (
              <label
                key={t.value}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  form.accountType === t.value
                    ? "border-secondary bg-secondary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value={t.value} className="sr-only" />
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    form.accountType === t.value ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <t.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-body font-semibold text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground font-body">{t.description}</p>
                </div>
              </label>
            ))}
          </RadioGroup>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="font-body">First name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10" placeholder="James" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-body">Last name</Label>
                <Input placeholder="Mwangi" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" type="email" placeholder="james@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-body">Phone number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-10" type="tel" placeholder="+254 712 345 678" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Security */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="font-body">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 pr-10"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.password && form.password.length < 8 && (
                <p className="text-xs text-destructive font-body">Password must be at least 8 characters</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-body">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  type="password"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                />
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-destructive font-body">Passwords do not match</p>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="font-body">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={!canNext() || loading || googleLoading}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-orange-dark font-body"
          >
            {loading ? "Creating account…" : googleLoading ? "Connecting with Google…" : step === STEPS.length - 1 ? "Create account" : (
              <>Next <ArrowRight className="h-4 w-4 ml-1" /></>
            )}
          </Button>
        </div>

        {step === 0 && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground font-body">or sign up with</span>
              </div>
            </div>
            <GoogleSignInButton onCredential={handleGoogleCredential} />
          </>
        )}
      </div>
    </AuthLayout>
  );
}
