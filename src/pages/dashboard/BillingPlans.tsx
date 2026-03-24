import { useState } from "react";
import { ArrowLeft, Check, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "starter", name: "Starter", badge: "For Independent Landlords",
    monthly: 1500, annual: 15000,
    features: ["Up to 5 listings", "1 team member", "5% commission", "Basic support"],
    popular: false,
  },
  {
    id: "professional", name: "Professional", badge: "For Small Agencies (1–10 agents)",
    monthly: 4500, annual: 45000,
    features: ["Up to 50 listings", "Up to 10 team members", "3% commission", "Priority support"],
    popular: true,
  },
  {
    id: "enterprise", name: "Enterprise", badge: "For Large Agencies (10+ agents)",
    monthly: null, annual: null,
    features: ["Unlimited listings", "Unlimited team members", "Negotiated flat fee", "Dedicated support"],
    popular: false,
  },
];

const CURRENT_PLAN = "professional";

type PayStep = "form" | "waiting" | "success" | "failed";

export default function BillingPlans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [payStep, setPayStep] = useState<PayStep>("form");
  const [phone, setPhone] = useState("0712 345 678");
  const [countdown, setCountdown] = useState(60);

  function openModal(plan: typeof plans[0]) {
    setSelectedPlan(plan);
    setPayStep("form");
    setCountdown(60);
    setModalOpen(true);
  }

  function startPayment() {
    setPayStep("waiting");
    let c = 60;
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        setPayStep("failed");
      }
    }, 1000);
    // Simulate success after ~4s
    setTimeout(() => {
      clearInterval(interval);
      setPayStep("success");
    }, 4000);
  }

  const amount = selectedPlan ? (billing === "monthly" ? selectedPlan.monthly : selectedPlan.annual) : 0;

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/billing")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Subscription Plans</h1>
          <p className="text-sm text-muted-foreground">Choose the plan that fits your business.</p>
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setBilling("monthly")} className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors", billing === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>Monthly</button>
        <button onClick={() => setBilling("annual")} className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors", billing === "annual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>
          Annual
          <Badge className="bg-green-100 text-green-700 border-0 text-[10px]">2 months free</Badge>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = billing === "monthly" ? plan.monthly : plan.annual;
          const isCurrent = plan.id === CURRENT_PLAN;
          return (
            <Card key={plan.id} className={cn("relative flex flex-col", plan.popular && "border-primary ring-2 ring-primary/20")}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 shadow">MOST POPULAR</Badge>
                </div>
              )}
              <CardHeader className="pb-4 pt-6">
                <Badge variant="outline" className="w-fit text-xs mb-2">{plan.badge}</Badge>
                <h3 className="text-xl font-heading font-bold">{plan.name}</h3>
                {price ? (
                  <div>
                    <span className="text-3xl font-bold">KES {price.toLocaleString()}</span>
                    <span className="text-muted-foreground text-sm">/{billing === "monthly" ? "mo" : "yr"}</span>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-muted-foreground">Contact Sales</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-6">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : plan.id === "enterprise" ? (
                    <Button className="w-full bg-primary hover:bg-primary/90" asChild>
                      <a href="mailto:sales@dwellyhomes.co.ke">Contact Sales</a>
                    </Button>
                  ) : (
                    <Button className="w-full bg-secondary hover:bg-secondary/90" onClick={() => openModal(plan)}>
                      Select {plan.name}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* M-Pesa Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => { if (!o && payStep !== "waiting") setModalOpen(false); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-green-600 flex items-center justify-center text-white text-xs font-bold">M</div>
              Pay via M-Pesa
            </DialogTitle>
          </DialogHeader>

          {payStep === "form" && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted/40 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><span className="font-medium">{selectedPlan?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">KES {amount?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Billing</span><span className="font-medium capitalize">{billing}</span></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">M-Pesa Phone Number</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">+254</span>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1" />
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={startPayment}>
                <Smartphone className="h-4 w-4 mr-2" />
                Pay KES {amount?.toLocaleString()}
              </Button>
            </div>
          )}

          {payStep === "waiting" && (
            <div className="py-6 text-center space-y-4">
              <div className="h-12 w-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div>
                <p className="font-semibold">Sending payment request to your phone…</p>
                <p className="text-sm text-muted-foreground mt-1">Check your phone for an M-Pesa prompt. Enter your PIN to complete payment.</p>
              </div>
              <p className="text-xs text-muted-foreground">Waiting for confirmation… (expires in {countdown}s)</p>
            </div>
          )}

          {payStep === "success" && (
            <div className="py-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-semibold text-green-700">Payment successful!</p>
              <p className="text-sm text-muted-foreground">Your {selectedPlan?.name} plan is now active.</p>
              <Button className="w-full" onClick={() => { setModalOpen(false); toast({ title: "Plan activated!" }); }}>Continue</Button>
            </div>
          )}

          {payStep === "failed" && (
            <div className="py-6 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <span className="text-2xl">✗</span>
              </div>
              <p className="font-semibold text-red-700">Payment not completed</p>
              <p className="text-sm text-muted-foreground">Please try again.</p>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>Cancel</Button>
                <Button className="flex-1 bg-secondary hover:bg-secondary/90" onClick={() => { setPayStep("form"); setCountdown(60); }}>Retry</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
