import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ password: "", confirm: "" });

  // Extract token from URL query param
  const token = new URLSearchParams(window.location.search).get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }
    setLoading(true);
    try {
      await api.patch("/auth/reset-password", { token, newPassword: form.password });
      toast.success("Password updated! You can now sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Set a new password" subtitle="Choose a strong password to keep your account secure.">
      <div className="space-y-6">
        <div className="lg:hidden text-center mb-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">Dwelly Homes</span>
          </Link>
        </div>

        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">New password</h2>
          <p className="text-sm text-muted-foreground mt-1 font-body">
            Your new password must be at least 8 characters long.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="font-body">New password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
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
            {form.password && form.password.length < 8 && (
              <p className="text-xs text-destructive font-body">Password must be at least 8 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="font-body">Confirm new password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Re-enter password"
                className="pl-10"
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              />
            </div>
            {form.confirm && form.password !== form.confirm && (
              <p className="text-xs text-destructive font-body">Passwords do not match</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary text-secondary-foreground hover:bg-orange-dark font-body"
          >
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>

        <Link
          to="/login"
          className="inline-flex text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
}
