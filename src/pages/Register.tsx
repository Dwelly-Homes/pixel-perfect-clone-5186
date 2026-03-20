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
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = () => {
    if (!canNext()) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/verify-otp", { state: { email: form.email } });
    }, 1000);
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
            disabled={!canNext() || loading}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-orange-dark font-body"
          >
            {loading ? "Creating account…" : step === STEPS.length - 1 ? "Create account" : (
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
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="font-body" type="button">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </Button>
              <Button variant="outline" className="font-body" type="button">
                <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Apple
              </Button>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
