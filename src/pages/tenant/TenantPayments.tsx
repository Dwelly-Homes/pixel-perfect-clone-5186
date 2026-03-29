import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  CreditCard, MapPin, Home, Calendar, TrendingUp, Clock,
  CheckCircle2, AlertTriangle, ShieldCheck, Search, MessageSquare,
  User, Phone, Mail, Banknote, Timer, RefreshCw, XCircle,
  Info,
} from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { Link } from "react-router-dom";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface LeaseProperty {
  _id: string;
  title: string;
  neighborhood: string;
  county: string;
  streetEstate?: string;
  propertyType: string;
  images: { url: string; isCover?: boolean }[];
}

interface LeaseAgent {
  fullName: string;
  phone?: string;
  email?: string;
}

interface Lease {
  _id: string;
  occupantName: string;
  monthlyRent: number;
  depositAmount: number;
  leaseStart: string;
  leaseEnd: string | null;
  status: "active" | "expired" | "terminated";
  notes: string | null;
  propertyId: LeaseProperty;
  agentId: LeaseAgent;
}

interface DisputeRef {
  _id: string;
  status: string;
  reason: string;
  adminNote?: string;
}

interface RentPayment {
  _id: string;
  amount: number;
  periodMonth: number;
  periodYear: number;
  paymentStatus: "pending" | "success" | "failed" | "cancelled";
  escrowStatus: "pending_payment" | "held" | "released" | "refunded" | "disputed";
  mpesaReceiptNumber: string | null;
  paidAt: string | null;
  heldUntil: string | null;
  tenantConfirmedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  releaseReason: string | null;
  disputeId: DisputeRef | null;
  createdAt: string;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const TYPE_LABEL: Record<string, string> = {
  bedsitter: "Bedsitter", studio: "Studio", "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom", "3_bedroom": "3 Bedroom",
  "4_plus_bedroom": "4+ Bedroom", maisonette: "Maisonette",
  bungalow: "Bungalow", townhouse: "Townhouse",
};

const escrowBadge = (status: RentPayment["escrowStatus"], paymentStatus: RentPayment["paymentStatus"]) => {
  if (paymentStatus === "failed")   return { label: "Failed",      cls: "bg-red-100 text-red-700" };
  if (paymentStatus === "pending")  return { label: "Awaiting PIN", cls: "bg-yellow-100 text-yellow-700" };
  const map: Record<RentPayment["escrowStatus"], { label: string; cls: string }> = {
    pending_payment: { label: "Awaiting M-Pesa",  cls: "bg-yellow-100 text-yellow-700" },
    held:            { label: "In Escrow",         cls: "bg-blue-100 text-blue-700" },
    released:        { label: "Released",          cls: "bg-green-100 text-green-700" },
    refunded:        { label: "Refunded",          cls: "bg-purple-100 text-purple-700" },
    disputed:        { label: "Under Dispute",     cls: "bg-orange-100 text-orange-700" },
  };
  return map[status];
};

const CountdownTimer = ({ heldUntil }: { heldUntil: string }) => {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const update = () => {
      const end = new Date(heldUntil);
      if (isPast(end)) { setRemaining("Expired"); return; }
      const diff = end.getTime() - Date.now();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [heldUntil]);

  const isExpired = isPast(new Date(heldUntil));

  return (
    <span className={`font-mono text-sm font-semibold ${isExpired ? "text-red-600" : "text-orange-600"}`}>
      {remaining}
    </span>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function TenantPayments() {
  const queryClient = useQueryClient();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Modals state
  const [payModal, setPayModal]         = useState(false);
  const [payPhone, setPayPhone]         = useState("");
  const [payMonth, setPayMonth]         = useState(currentMonth);
  const [payYear, setPayYear]           = useState(currentYear);

  const [confirmModal, setConfirmModal]     = useState<string | null>(null); // paymentId
  const [disputeModal, setDisputeModal]     = useState<string | null>(null); // paymentId
  const [disputeReason, setDisputeReason]   = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState("");

  const [pollingId, setPollingId] = useState<string | null>(null);

  // ── Queries ──
  const { data: lease, isLoading: leaseLoading } = useQuery<Lease | null>({
    queryKey: ["myLease"],
    queryFn: async () => {
      const { data } = await api.get("/leases/my");
      return (data?.data as Lease | null) ?? null;
    },
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["myRentPayments"],
    queryFn: async () => {
      const { data } = await api.get("/rent-payments/my?limit=50");
      return data?.data as RentPayment[] ?? [];
    },
    enabled: !!lease,
    refetchInterval: pollingId ? 4000 : false,
  });

  const payments: RentPayment[] = useMemo(() => paymentsData ?? [], [paymentsData]);

  // Stop polling when pending payment resolves
  useEffect(() => {
    if (!pollingId || !payments.length) return;
    const target = payments.find((p) => p._id === pollingId);
    if (target && target.paymentStatus !== "pending") {
      setPollingId(null);
      if (target.paymentStatus === "success") {
        toast.success("Payment confirmed! Funds are now in escrow.");
      } else if (target.paymentStatus === "failed") {
        toast.error("Payment failed. Please try again.");
      }
    }
  }, [payments, pollingId]);

  // ── Mutations ──
  const initiateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/rent-payments/initiate", {
        leaseId: lease?._id,
        phone: payPhone,
        periodMonth: payMonth,
        periodYear: payYear,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success("M-Pesa prompt sent! Enter your PIN on your phone.");
      setPayModal(false);
      setPayPhone("");
      setPollingId(data.data?.paymentId ?? null);
      queryClient.invalidateQueries({ queryKey: ["myRentPayments"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await api.post(`/rent-payments/${paymentId}/confirm-move-in`);
    },
    onSuccess: () => {
      toast.success("Move-in confirmed! Funds released to landlord.");
      setConfirmModal(null);
      queryClient.invalidateQueries({ queryKey: ["myRentPayments"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const disputeMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      await api.post(`/rent-payments/${paymentId}/dispute`, {
        reason: disputeReason,
        evidence: disputeEvidence || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Dispute raised. Our team will review within 24 hours.");
      setDisputeModal(null);
      setDisputeReason("");
      setDisputeEvidence("");
      queryClient.invalidateQueries({ queryKey: ["myRentPayments"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // ── Loading state ──
  if (leaseLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground font-body text-sm">Track your rent payments.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  // ── No lease state ──
  if (!lease) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground font-body text-sm">Track your rent payments and payment history.</p>
        </div>
        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-sm">No active tenancy yet</p>
              <p className="text-sm text-muted-foreground font-body">
                Once you move into a property sourced through Dwelly, your rent payments will appear here.
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button size="sm" asChild className="bg-secondary hover:bg-secondary/90">
            <Link to="/"><Search className="h-4 w-4 mr-2" />Browse Properties</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to="/tenant/messages"><MessageSquare className="h-4 w-4 mr-2" />Message Agent</Link>
          </Button>
        </div>
      </div>
    );
  }

  const property = lease.propertyId;
  const agent = lease.agentId;
  const coverImage = property.images?.find((i) => i.isCover)?.url || property.images?.[0]?.url;

  const activePayment = payments.find((p) =>
    ["pending_payment", "held", "disputed"].includes(p.escrowStatus)
  );

  const isThisMonthPaid = payments.some(
    (p) =>
      p.periodMonth === currentMonth &&
      p.periodYear === currentYear &&
      ["held", "released", "disputed"].includes(p.escrowStatus)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground font-body text-sm">Your active tenancy and rent payments.</p>
        </div>
        <Button
          onClick={() => setPayModal(true)}
          className="bg-secondary hover:bg-secondary/90 shrink-0"
          disabled={!!activePayment || isThisMonthPaid}
        >
          <Banknote className="h-4 w-4 mr-2" />
          Pay Rent
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp,   color: "text-green-600",  value: `KES ${lease.monthlyRent.toLocaleString()}`, label: "Monthly Rent" },
          { icon: Clock,        color: "text-secondary",  value: format(new Date(lease.leaseStart), "d MMM yyyy"), label: "Lease Start" },
          { icon: CheckCircle2, color: "text-blue-500",   value: payments.filter((p) => p.escrowStatus === "released").length.toString(), label: "Payments Made" },
          { icon: Calendar,     color: "text-amber-500",  value: lease.leaseEnd ? format(new Date(lease.leaseEnd), "d MMM yyyy") : "Open-ended", label: "Lease End" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold font-heading truncate">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-body leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active escrow banner */}
      {activePayment?.escrowStatus === "held" && (
        <Card className="border-blue-300 bg-blue-50/50">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-sm">KES {activePayment.amount.toLocaleString()} is held in escrow</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activePayment.heldUntil && !isPast(new Date(activePayment.heldUntil)) ? (
                    <>Auto-releases in <CountdownTimer heldUntil={activePayment.heldUntil} /></>
                  ) : "Auto-release window has passed"}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setConfirmModal(activePayment._id)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Confirm Move-In
              </Button>
              {activePayment.heldUntil && !isPast(new Date(activePayment.heldUntil)) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-400 text-orange-600 hover:bg-orange-50"
                  onClick={() => setDisputeModal(activePayment._id)}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                  Raise Dispute
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disputed payment banner */}
      {activePayment?.escrowStatus === "disputed" && (
        <Card className="border-orange-300 bg-orange-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Dispute under review</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your KES {activePayment.amount.toLocaleString()} rent is frozen. Our team is reviewing your case.
                {activePayment.disputeId?.adminNote && (
                  <span className="block mt-1 font-medium text-foreground">Admin note: {activePayment.disputeId.adminNote}</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending M-Pesa prompt */}
      {activePayment?.escrowStatus === "pending_payment" && (
        <Card className="border-yellow-300 bg-yellow-50/50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center shrink-0">
              <RefreshCw className="h-5 w-5 text-yellow-600 animate-spin" />
            </div>
            <div>
              <p className="font-semibold text-sm">Waiting for M-Pesa confirmation...</p>
              <p className="text-xs text-muted-foreground">Enter your M-Pesa PIN on your phone to complete the payment.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Property card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading">Your Property</CardTitle>
            <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active Tenancy</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {coverImage && (
              <div className="w-full sm:w-40 h-32 sm:h-auto shrink-0 overflow-hidden">
                <img src={coverImage} alt={property.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-4 space-y-2 flex-1">
              <div>
                <p className="font-semibold font-heading">{property.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[property.streetEstate, property.neighborhood, property.county].filter(Boolean).join(", ")}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {TYPE_LABEL[property.propertyType] ?? property.propertyType}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Your Agent / Landlord</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{agent.fullName}</p>
              {agent.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {agent.phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {agent.phone && (
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
                <a href={`tel:${agent.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" />Call</a>
              </Button>
            )}
            {agent.email && (
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
                <a href={`mailto:${agent.email}`}><Mail className="h-3.5 w-3.5 mr-1.5" />Email</a>
              </Button>
            )}
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 flex-1 sm:flex-none" asChild>
              <Link to="/tenant/messages"><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Message</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How escrow works */}
      <Card className="border-muted">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            How Rent Escrow Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {[
            { icon: Banknote,     color: "text-blue-500",   text: "Pay rent via M-Pesa — funds go into secure escrow, not directly to the landlord." },
            { icon: Timer,        color: "text-orange-500", text: "You have 24 hours to confirm your move-in. Funds are released to the landlord only after confirmation." },
            { icon: CheckCircle2, color: "text-green-500",  text: "Confirming move-in immediately releases funds to the landlord." },
            { icon: AlertTriangle,color: "text-orange-500", text: "Raise a dispute within 24 hours if there's an issue — funds are frozen until an admin reviews." },
            { icon: XCircle,      color: "text-gray-400",   text: "If you don't confirm within 24 hours, funds are automatically released to the landlord." },
          ].map(({ icon: Icon, color, text }) => (
            <div key={text} className="flex items-start gap-2">
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${color}`} />
              <span>{text}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paymentsLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 flex flex-col items-center text-center gap-3">
              <CreditCard className="h-10 w-10 text-muted-foreground opacity-30" />
              <div>
                <p className="font-medium text-sm">No payment records yet</p>
                <p className="text-xs text-muted-foreground mt-1">Your rent payment history will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {payments.map((payment) => {
                const badge = escrowBadge(payment.escrowStatus, payment.paymentStatus);
                const isHeld = payment.escrowStatus === "held";
                const isDisputed = payment.escrowStatus === "disputed";

                return (
                  <div key={payment._id} className="p-4 flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {MONTH_NAMES[payment.periodMonth - 1]} {payment.periodYear} — KES {payment.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.paidAt
                            ? `Paid ${formatDistanceToNow(new Date(payment.paidAt), { addSuffix: true })}`
                            : `Initiated ${formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}`}
                          {payment.mpesaReceiptNumber && ` · ${payment.mpesaReceiptNumber}`}
                        </p>
                        {isHeld && payment.heldUntil && (
                          <p className="text-xs text-orange-600 mt-0.5">
                            Auto-releases in <CountdownTimer heldUntil={payment.heldUntil} />
                          </p>
                        )}
                        {isDisputed && payment.disputeId?.status && (
                          <p className="text-xs text-orange-600 mt-0.5">
                            Dispute status: {payment.disputeId.status.replace(/_/g, " ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Badge className={`${badge.cls} border-0 text-xs`}>{badge.label}</Badge>
                      {isHeld && !isPast(new Date(payment.heldUntil!)) && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => setConfirmModal(payment._id)}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 text-orange-600 border-orange-300 hover:bg-orange-50"
                            onClick={() => setDisputeModal(payment._id)}
                          >
                            Dispute
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── PAY RENT MODAL ────────────────────────────────────────────────── */}
      <Dialog open={payModal} onOpenChange={setPayModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Rent via M-Pesa</DialogTitle>
            <DialogDescription>
              Enter your M-Pesa number. A prompt will be sent to your phone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span className="font-medium truncate ml-4">{property.title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold text-green-700">KES {lease.monthlyRent.toLocaleString()}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Month</Label>
                <select
                  value={payMonth}
                  onChange={(e) => setPayMonth(Number(e.target.value))}
                  className="w-full mt-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <select
                  value={payYear}
                  onChange={(e) => setPayYear(Number(e.target.value))}
                  className="w-full mt-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label className="text-xs">M-Pesa Phone Number</Label>
              <Input
                className="mt-1"
                placeholder="e.g. 0712345678"
                value={payPhone}
                onChange={(e) => setPayPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayModal(false)}>Cancel</Button>
            <Button
              className="bg-secondary hover:bg-secondary/90"
              onClick={() => initiateMutation.mutate()}
              disabled={initiateMutation.isPending || !payPhone.trim()}
            >
              {initiateMutation.isPending ? "Sending..." : "Send M-Pesa Prompt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CONFIRM MOVE-IN MODAL ─────────────────────────────────────────── */}
      <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Move-In</DialogTitle>
            <DialogDescription>
              By confirming, you verify that you have successfully moved into the property.
              Funds will be <strong>immediately released</strong> to the landlord.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 inline mr-1.5 text-green-600" />
            This action cannot be undone. Only confirm if you have physically moved in.
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => confirmModal && confirmMutation.mutate(confirmModal)}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? "Confirming..." : "Yes, I've Moved In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── RAISE DISPUTE MODAL ───────────────────────────────────────────── */}
      <Dialog open={!!disputeModal} onOpenChange={() => { setDisputeModal(null); setDisputeReason(""); setDisputeEvidence(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise a Dispute</DialogTitle>
            <DialogDescription>
              Describe the issue with your rental. Funds will be frozen until an admin reviews.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <Label className="text-xs">Reason for dispute <span className="text-red-500">*</span></Label>
              <Textarea
                className="mt-1"
                placeholder="e.g. Property was not in the condition described, key was not provided..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label className="text-xs">Additional evidence (optional)</Label>
              <Textarea
                className="mt-1"
                placeholder="Photos taken, conversations with agent, etc."
                value={disputeEvidence}
                onChange={(e) => setDisputeEvidence(e.target.value)}
                rows={2}
              />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
              <AlertTriangle className="h-3.5 w-3.5 inline mr-1 text-orange-600" />
              Disputes must be raised within the 24-hour escrow window. Our team will respond within 24 hours.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDisputeModal(null); setDisputeReason(""); setDisputeEvidence(""); }}>Cancel</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={() => disputeModal && disputeMutation.mutate(disputeModal)}
              disabled={disputeMutation.isPending || disputeReason.trim().length < 10}
            >
              {disputeMutation.isPending ? "Submitting..." : "Submit Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
