import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { completeGoogleAuth } from "@/lib/googleAuth";

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const navigateForUser = (role: string) => {
    if (role === "platform_admin") navigate("/admin");
    else if (role === "searcher") navigate("/tenant");
    else navigate("/dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", {
        identifier: form.email,
        password: form.password,
      });
      const { accessToken, refreshToken, user } = data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success("Welcome back to Dwelly Homes!");
      // Redirect based on role
      if (user.role === "platform_admin") navigate("/admin");
      else if (user.role === "searcher") navigate("/tenant");
      else navigate("/dashboard");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setGoogleLoading(true);
    try {
      const { accessToken, refreshToken, user } = await completeGoogleAuth(credential);
      setAuth(user, accessToken, refreshToken);
      toast.success("Welcome back to Dwelly Homes!");
      navigateForUser(user.role);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to manage your properties, bookings, and messages.">
      <div className="space-y-6">
        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">Dwelly Homes</span>
          </Link>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Sign in</h2>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Don't have an account?{" "}
            <Link to="/register" className="text-secondary hover:text-orange-dark font-medium transition-colors">
              Create one
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-body">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="font-body">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs text-secondary hover:text-orange-dark font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="pl-10 pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="remember" />
            <Label htmlFor="remember" className="text-sm font-body text-muted-foreground cursor-pointer">
              Remember me for 30 days
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full bg-secondary text-secondary-foreground hover:bg-orange-dark"
            disabled={loading || googleLoading}
          >
            {loading ? "Signing in…" : googleLoading ? "Connecting with Google…" : "Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-3 text-muted-foreground font-body">or continue with</span>
          </div>
        </div>

        <GoogleSignInButton onCredential={handleGoogleCredential} />
      </div>
    </AuthLayout>
  );
}
