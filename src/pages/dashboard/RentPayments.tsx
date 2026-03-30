import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, CreditCard, TrendingUp, AlertCircle,
  ChevronRight, Users, Clock, CheckCircle2, XCircle, Shield,
  Phone, Mail, Calendar, Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeaseProperty {
  _id: string;
  title: string;
  neighborhood: string;
  county: string;
}

interface Lease {
  _id: string;
  occupantName: string;
  occupantPhone?: string;
  occupantEmail?: string;
  monthlyRent: number;
  leaseStart: string;
  leaseEnd?: string | null;
  status: string;
  propertyId: LeaseProperty;
}

interface RentPayment {
  _id: string;
  leaseId: { _id: string; occupantName: string; monthlyRent: number } | string;
  propertyId: LeaseProperty;
  periodMonth: number;
  periodYear: number;
  amount: number;
  paymentStatus: string;
  escrowStatus: string;
  mpesaReceiptNumber: string | null;
  paidAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  heldUntil: string | null;
  disputeId?: { status: string; reason: string } | null;
  phone: string;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getYearOptions() {
  const now = new Date().getFullYear();
  return Array.from({ length: now - 2023 }, (_, i) => now - i);
}

function escrowBadge(escrowStatus: string, paymentStatus: string) {
  if (paymentStatus === "failed" || paymentStatus === "cancelled") {
    return <Badge variant="destructive" className="text-xs">Failed</Badge>;
  }
  switch (escrowStatus) {
    case "pending_payment":
      return <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">Awaiting Payment</Badge>;
    case "held":
      return <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200">In Escrow</Badge>;
    case "released":
      return <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Released</Badge>;
    case "refunded":
      return <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">Refunded</Badge>;
    case "disputed":
      return <Badge variant="destructive" className="text-xs">Disputed</Badge>;
    default:
      return <Badge variant="outline" className="text-xs text-muted-foreground">Unknown</Badge>;
  }
}

function EscrowIcon({ escrowStatus, paymentStatus }: { escrowStatus: string; paymentStatus: string }) {
  if (paymentStatus === "failed" || paymentStatus === "cancelled") return <XCircle className="h-4 w-4 text-destructive" />;
  if (escrowStatus === "released") return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (escrowStatus === "held") return <Shield className="h-4 w-4 text-blue-500" />;
  if (escrowStatus === "disputed") return <AlertCircle className="h-4 w-4 text-destructive" />;
  if (escrowStatus === "refunded") return <TrendingUp className="h-4 w-4 text-yellow-600" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

// ─── Sub-component: History view for a single lease ──────────────────────────

function LeaseHistory({
  lease,
  onBack,
}: {
  lease: Lease;
  onBack: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["leasePayments", lease._id],
    queryFn: async () => {
      const { data } = await api.get(`/rent-payments/lease/${lease._id}?limit=50`);
      return data;
    },
  });

  const payments: RentPayment[] = data?.data ?? [];

  const totalPaid = payments
    .filter((p) => ["held", "released"].includes(p.escrowStatus))
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      {/* Back + heading */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="min-w-0">
          <h2 className="font-heading font-bold text-lg truncate">{lease.occupantName}</h2>
          <p className="text-xs text-muted-foreground">
            {lease.propertyId?.title} · KES {lease.monthlyRent.toLocaleString()}/mo
          </p>
        </div>
      </div>

      {/* Tenant info card */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tenant</p>
            <p className="font-medium text-sm">{lease.occupantName}</p>
            {lease.occupantPhone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" /> {lease.occupantPhone}
              </p>
            )}
            {lease.occupantEmail && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" /> {lease.occupantEmail}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Property</p>
            <p className="font-medium text-sm">{lease.propertyId?.title}</p>
            <p className="text-xs text-muted-foreground">
              {[lease.propertyId?.neighborhood, lease.propertyId?.county].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Lease Period</p>
            <p className="font-medium text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(lease.leaseStart), "d MMM yyyy")}
              {lease.leaseEnd ? ` → ${format(new Date(lease.leaseEnd), "d MMM yyyy")}` : " (Open-ended)"}
            </p>
            <p className="text-xs font-semibold">
              Total Received: <span className="text-green-700">KES {totalPaid.toLocaleString()}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment history table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center">
              <Receipt className="h-8 w-8 mx-auto text-muted-foreground opacity-30 mb-2" />
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>M-Pesa Receipt</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead>Released On</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {MONTHS[(p.periodMonth ?? 1) - 1]} {p.periodYear}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        KES {p.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {escrowBadge(p.escrowStatus, p.paymentStatus)}
                        {p.disputeId && (
                          <span className="ml-1 text-[10px] text-destructive font-medium">
                            · {p.disputeId.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.mpesaReceiptNumber ?? <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {p.paidAt ? format(new Date(p.paidAt), "d MMM yyyy, HH:mm") : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {p.releasedAt
                          ? format(new Date(p.releasedAt), "d MMM yyyy")
                          : p.refundedAt
                          ? <span className="text-yellow-600">{format(new Date(p.refundedAt), "d MMM yyyy")} (refunded)</span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RentPayments() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);

  // All active leases
  const { data: leasesData, isLoading: leasesLoading } = useQuery({
    queryKey: ["activeLeases"],
    queryFn: async () => {
      const { data } = await api.get("/leases?status=active&limit=100");
      return data;
    },
    staleTime: 60_000,
  });

  // Payments for the selected period
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["orgPayments", month, year],
    queryFn: async () => {
      const { data } = await api.get(
        `/rent-payments/org?periodMonth=${month}&periodYear=${year}&limit=200`
      );
      return data;
    },
  });

  const leases: Lease[] = leasesData?.data ?? [];
  const periodPayments: RentPayment[] = paymentsData?.data ?? [];

  // Map: leaseId → payment for the selected period (latest per lease)
  const paymentByLease = new Map<string, RentPayment>();
  for (const p of periodPayments) {
    const lid = typeof p.leaseId === "string" ? p.leaseId : p.leaseId?._id;
    if (lid && !paymentByLease.has(lid)) paymentByLease.set(lid, p);
  }

  // Stats
  const totalExpected = leases.reduce((s, l) => s + l.monthlyRent, 0);
  const paidPayments = periodPayments.filter((p) =>
    ["held", "released"].includes(p.escrowStatus)
  );
  const totalCollected = paidPayments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, totalExpected - totalCollected);
  const paidCount = leases.filter((l) => {
    const p = paymentByLease.get(l._id);
    return p && ["held", "released"].includes(p.escrowStatus);
  }).length;
  const disputeCount = periodPayments.filter((p) => p.escrowStatus === "disputed").length;

  const loading = leasesLoading || paymentsLoading;

  // If a lease is selected, show the detail view
  if (selectedLease) {
    return (
      <div className="p-6">
        <LeaseHistory lease={selectedLease} onBack={() => setSelectedLease(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Rent Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track payment status and history for all your tenants.
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-2">
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getYearOptions().map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Expected",
            value: loading ? null : `KES ${totalExpected.toLocaleString()}`,
            icon: CreditCard,
            color: "text-muted-foreground",
          },
          {
            label: "Collected",
            value: loading ? null : `KES ${totalCollected.toLocaleString()}`,
            icon: CheckCircle2,
            color: "text-green-600",
          },
          {
            label: "Outstanding",
            value: loading ? null : `KES ${outstanding.toLocaleString()}`,
            icon: AlertCircle,
            color: outstanding > 0 ? "text-amber-500" : "text-muted-foreground",
          },
          {
            label: "Disputes",
            value: loading ? null : disputeCount,
            icon: Shield,
            color: disputeCount > 0 ? "text-destructive" : "text-muted-foreground",
          },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {stat.value === null ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className="text-xl font-bold font-heading">{stat.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      {!loading && totalExpected > 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">
                Collection Progress — {MONTHS[month - 1]} {year}
              </p>
              <span className="text-sm font-bold text-green-700">
                {Math.round((totalCollected / totalExpected) * 100)}%
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${Math.min(100, (totalCollected / totalExpected) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {paidCount} of {leases.length} tenant{leases.length !== 1 ? "s" : ""} paid
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tenants table */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Users className="h-4 w-4" />
            Tenant Payment Status
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              ({MONTHS[month - 1]} {year})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : leases.length === 0 ? (
            <div className="p-10 text-center">
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-sm font-medium">No active tenants</p>
              <p className="text-xs text-muted-foreground mt-1">
                Onboard a tenant from your Properties page to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Monthly Rent</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>M-Pesa Receipt</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leases.map((lease) => {
                    const payment = paymentByLease.get(lease._id);
                    return (
                      <TableRow key={lease._id} className="hover:bg-muted/40">
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{lease.occupantName}</p>
                            {lease.occupantPhone && (
                              <p className="text-xs text-muted-foreground">{lease.occupantPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium truncate max-w-[160px]">
                              {lease.propertyId?.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                              {[lease.propertyId?.neighborhood, lease.propertyId?.county]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap">
                          KES {lease.monthlyRent.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {payment ? (
                            <div className="flex items-center gap-1.5">
                              <EscrowIcon
                                escrowStatus={payment.escrowStatus}
                                paymentStatus={payment.paymentStatus}
                              />
                              {escrowBadge(payment.escrowStatus, payment.paymentStatus)}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                              <Clock className="h-3 w-3" /> Not Paid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {payment?.mpesaReceiptNumber ?? (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {payment?.paidAt ? (
                            format(new Date(payment.paidAt), "d MMM yyyy")
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-secondary h-7 px-2 text-xs gap-1"
                            onClick={() => setSelectedLease(lease)}
                          >
                            History <ChevronRight className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
