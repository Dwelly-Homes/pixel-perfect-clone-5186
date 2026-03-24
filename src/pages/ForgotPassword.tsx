import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { identifier: email });
      setSent(true);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Reset your password" subtitle="We'll send you a link to reset your password securely.">
      <div className="space-y-6">
        <div className="lg:hidden text-center mb-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">Dwelly Homes</span>
          </Link>
        </div>

        {sent ? (
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <h2 className="font-heading text-2xl font-bold text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground font-body max-w-xs">
              We sent a password reset link to <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button
              onClick={() => setSent(false)}
              variant="outline"
              className="mt-2 font-body"
            >
              Try a different email
            </Button>
            <Link to="/login" className="text-sm text-secondary hover:text-orange-dark font-body font-medium transition-colors">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Forgot password?</h2>
              <p className="text-sm text-muted-foreground mt-1 font-body">
                Enter the email associated with your account and we'll send a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="font-body">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground hover:bg-orange-dark font-body"
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>

            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
