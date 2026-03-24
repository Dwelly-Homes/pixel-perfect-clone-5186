import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Home, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const location = useLocation();
  const state = location.state as { phone?: string; email?: string } | null;
  const phone = state?.phone || "";
  const email = state?.email || "your email";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async () => {
    if (otp.length < 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { phone, otp });
      const { accessToken, refreshToken, user } = data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success("Phone verified! Welcome to Dwelly Homes.");
      if (user.role === "platform_admin") navigate("/admin");
      else if (user.role === "searcher") navigate("/tenant");
      else navigate("/dashboard");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone) {
      toast.error("Phone number not found. Please register again.");
      return;
    }
    setResending(true);
    try {
      await api.post("/auth/resend-otp", { phone });
      setCountdown(60);
      toast.info("A new verification code has been sent");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout title="Verify your email" subtitle="We sent a 6-digit code to confirm your identity.">
      <div className="space-y-6">
        <div className="lg:hidden text-center mb-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl text-foreground">Dwelly Homes</span>
          </Link>
        </div>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-full bg-secondary/10 flex items-center justify-center">
            <MailCheck className="h-7 w-7 text-secondary" />
          </div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Check your inbox</h2>
          <p className="text-sm text-muted-foreground font-body max-w-xs">
            We sent a 6-digit verification code to{" "}
            <span className="font-medium text-foreground">{phone || email}</span>
          </p>
        </div>

        <div className="flex justify-center">
          <InputOTP maxLength={6} value={otp} onChange={setOtp}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={handleVerify}
          disabled={otp.length < 6 || loading}
          className="w-full bg-secondary text-secondary-foreground hover:bg-orange-dark font-body"
        >
          {loading ? "Verifying…" : "Verify email"}
        </Button>

        <p className="text-center text-sm text-muted-foreground font-body">
          Didn't receive a code?{" "}
          {countdown > 0 ? (
            <span>Resend in {countdown}s</span>
          ) : (
            <button onClick={handleResend} disabled={resending} className="text-secondary hover:text-orange-dark font-medium transition-colors disabled:opacity-50">
              {resending ? "Sending…" : "Resend code"}
            </button>
          )}
        </p>

        <p className="text-center text-xs text-muted-foreground font-body">
          <Link to="/login" className="text-secondary hover:text-orange-dark transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
