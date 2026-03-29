import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  AlertTriangle, CheckCircle2, XCircle, Clock, Eye,
  Banknote, User, MapPin, FileText,
} from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Dispute {
  _id: string;
  status: "open" | "under_review" | "resolved_refund" | "resolved_release";
  reason: string;
  evidence: string | null;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  rentPaymentId: {
    _id: string;
    amount: number;
    phone: string;
    periodMonth: number;
    periodYear: number;
    mpesaReceiptNumber: string | null;
    escrowStatus: string;
  };
  raisedByUserId: { fullName: string; email: string; phone: string };
  leaseId: { occupantName: string; monthlyRent: number };
  propertyId: { title: string; neighborhood: string; county: string };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const statusBadge = (status: Dispute["status"]) => {
  const map: Record<Dispute["status"], { label: string; cls: string; icon: typeof AlertTriangle }> = {
    open:              { label: "Open",             cls: "bg-red-100 text-red-700",     icon: AlertTriangle },
    under_review:      { label: "Under Review",     cls: "bg-yellow-100 text-yellow-700", icon: Clock },
    resolved_refund:   { label: "Refunded",         cls: "bg-purple-100 text-purple-700", icon: XCircle },
    resolved_release:  { label: "Released",         cls: "bg-green-100 text-green-700",   icon: CheckCircle2 },
  };
  return map[status];
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function AdminDisputes() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [decision, setDecision] = useState<"release" | "refund">("release");
  const [adminNote, setAdminNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["adminDisputes", statusFilter],
    queryFn: async () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      const { data } = await api.get(`/rent-payments/admin/disputes${params}`);
      return data?.data as Dispute[] ?? [];
    },
  });

  const disputes = data ?? [];

  const markReviewMutation = useMutation({
    mutationFn: async (disputeId: string) => {
      await api.patch(`/rent-payments/admin/disputes/${disputeId}/status`, { status: "under_review" });
    },
    onSuccess: () => {
      toast.success("Dispute marked as under review.");
      queryClient.invalidateQueries({ queryKey: ["adminDisputes"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ disputeId, decision, adminNote }: { disputeId: string; decision: "release" | "refund"; adminNote: string }) => {
      await api.post(`/rent-payments/admin/disputes/${disputeId}/resolve`, { decision, adminNote: adminNote || undefined });
    },
    onSuccess: (_, { decision }) => {
      toast.success(decision === "release" ? "Funds released to landlord." : "Refund initiated for tenant.");
      setSelectedDispute(null);
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["adminDisputes"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const openDisputes = disputes.filter((d) => d.status === "open").length;
  const underReview = disputes.filter((d) => d.status === "under_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Rent Disputes</h1>
        <p className="text-muted-foreground text-sm">Review and resolve tenant rent payment disputes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open",         value: disputes.filter((d) => d.status === "open").length,             color: "text-red-600",     icon: AlertTriangle },
          { label: "Under Review", value: disputes.filter((d) => d.status === "under_review").length,      color: "text-yellow-600",  icon: Clock },
          { label: "Released",     value: disputes.filter((d) => d.status === "resolved_release").length,  color: "text-green-600",   icon: CheckCircle2 },
          { label: "Refunded",     value: disputes.filter((d) => d.status === "resolved_refund").length,   color: "text-purple-600",  icon: XCircle },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold font-heading">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alert for pending disputes */}
      {(openDisputes > 0 || underReview > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          <p className="text-sm text-red-800">
            <strong>{openDisputes + underReview} active dispute{openDisputes + underReview !== 1 ? "s" : ""}</strong> require attention. Funds are frozen until resolved.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Disputes</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="resolved_release">Resolved — Released</SelectItem>
            <SelectItem value="resolved_refund">Resolved — Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : disputes.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground opacity-30" />
              <div>
                <p className="font-medium">No disputes found</p>
                <p className="text-sm text-muted-foreground">All rent disputes will appear here for review.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {disputes.map((dispute) => {
                const badge = statusBadge(dispute.status);
                const isActive = ["open", "under_review"].includes(dispute.status);

                return (
                  <div key={dispute._id} className="p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">
                              KES {dispute.rentPaymentId?.amount?.toLocaleString()} ·{" "}
                              {MONTH_NAMES[(dispute.rentPaymentId?.periodMonth ?? 1) - 1]} {dispute.rentPaymentId?.periodYear}
                            </p>
                            <Badge className={`${badge.cls} border-0 text-xs`}>{badge.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" /> {dispute.raisedByUserId?.fullName} · {dispute.raisedByUserId?.phone}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {dispute.propertyId?.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{dispute.reason}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Raised {formatDistanceToNow(new Date(dispute.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 items-end shrink-0">
                        {isActive && (
                          <>
                            {dispute.status === "open" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-8"
                                onClick={() => markReviewMutation.mutate(dispute._id)}
                                disabled={markReviewMutation.isPending}
                              >
                                <Clock className="h-3 w-3 mr-1.5" />
                                Mark Under Review
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className="bg-secondary hover:bg-secondary/90 text-xs h-8"
                              onClick={() => { setSelectedDispute(dispute); setDecision("release"); setAdminNote(""); }}
                            >
                              <Eye className="h-3 w-3 mr-1.5" />
                              Resolve
                            </Button>
                          </>
                        )}
                        {!isActive && dispute.adminNote && (
                          <p className="text-xs text-muted-foreground text-right max-w-32 line-clamp-2 italic">
                            "{dispute.adminNote}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── RESOLVE MODAL ─────────────────────────────────────────────────── */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Review the dispute details below and make a final decision.
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              {/* Details */}
              <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">KES {selectedDispute.rentPaymentId?.amount?.toLocaleString()}</span>
                  <span className="text-muted-foreground">
                    — {MONTH_NAMES[(selectedDispute.rentPaymentId?.periodMonth ?? 1) - 1]} {selectedDispute.rentPaymentId?.periodYear}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{selectedDispute.raisedByUserId?.fullName} ({selectedDispute.raisedByUserId?.phone})</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedDispute.propertyId?.title}, {selectedDispute.propertyId?.neighborhood}</span>
                </div>
                {selectedDispute.rentPaymentId?.mpesaReceiptNumber && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Receipt: {selectedDispute.rentPaymentId.mpesaReceiptNumber}</span>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs font-medium">Tenant's Reason</Label>
                <p className="mt-1 text-sm bg-orange-50 border border-orange-100 rounded-md p-3">{selectedDispute.reason}</p>
              </div>

              {selectedDispute.evidence && (
                <div>
                  <Label className="text-xs font-medium">Additional Evidence</Label>
                  <p className="mt-1 text-sm text-muted-foreground bg-muted/40 rounded-md p-3">{selectedDispute.evidence}</p>
                </div>
              )}

              <div>
                <Label className="text-xs font-medium">Decision <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button
                    onClick={() => setDecision("release")}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      decision === "release"
                        ? "border-green-500 bg-green-50"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-600 mb-1" />
                    <p className="text-sm font-semibold">Release to Landlord</p>
                    <p className="text-xs text-muted-foreground">Landlord receives the rent</p>
                  </button>
                  <button
                    onClick={() => setDecision("refund")}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      decision === "refund"
                        ? "border-purple-500 bg-purple-50"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-purple-600 mb-1" />
                    <p className="text-sm font-semibold">Refund Tenant</p>
                    <p className="text-xs text-muted-foreground">Tenant gets their money back</p>
                  </button>
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium">Admin Note (optional)</Label>
                <Textarea
                  className="mt-1"
                  placeholder="Explain your decision to both parties..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDispute(null)}>Cancel</Button>
            <Button
              className={decision === "release" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-purple-600 hover:bg-purple-700 text-white"}
              onClick={() =>
                selectedDispute &&
                resolveMutation.mutate({ disputeId: selectedDispute._id, decision, adminNote })
              }
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending
                ? "Processing..."
                : decision === "release"
                ? "Release to Landlord"
                : "Refund Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
