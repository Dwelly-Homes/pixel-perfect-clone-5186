import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle, ExternalLink, User, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";

const docStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const DOC_LABELS: Record<string, string> = {
  national_id_front: "National ID — Front",
  national_id_back: "National ID — Back",
  kra_pin: "KRA PIN Certificate",
  business_registration: "Business Registration",
  earb_certificate: "EARB Certificate",
};

export default function AdminVerificationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: verificationData, isLoading } = useQuery({
    queryKey: ["verificationReview", id],
    queryFn: async () => {
      const { data } = await api.get(`/verification/admin/${id}`);
      return data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: ({ status, notes }: { status: string; notes?: string }) =>
      api.patch(`/verification/admin/${id}/review`, { status, notes }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["verificationReview", id] });
      queryClient.invalidateQueries({ queryKey: ["adminVerifications"] });
      const label = vars.status === "approved" ? "Approved"
        : vars.status === "rejected" ? "Rejected"
        : vars.status === "information_requested" ? "Info Requested"
        : "Updated";
      const tenantName = typeof verificationData?.tenantId === "object"
        ? verificationData.tenantId?.businessName : "";
      toast.success(`Verification ${label}`, { description: tenantName ? `${tenantName} has been notified.` : undefined });
      navigate("/admin/verifications");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  function handleDecision(decision: "approved" | "rejected" | "information_requested") {
    if ((decision === "rejected" || decision === "information_requested") && !note.trim()) {
      toast.error("Note required — please explain the decision.");
      return;
    }
    setSubmitting(true);
    reviewMutation.mutate({ status: decision, notes: note.trim() || undefined }, {
      onSettled: () => setSubmitting(false),
    });
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="h-8 bg-muted rounded w-64 mb-4 animate-pulse" />
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const verification = verificationData;
  const tenant = typeof verification?.tenantId === "object" ? verification.tenantId : null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const docs: any[] = verification?.documents || [];
  const isEstateAgent = tenant?.accountType === "estate_agent";

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/verifications")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Review Verification</h1>
          <p className="text-sm text-muted-foreground">
            {verification?.submittedAt
              ? `Submitted ${new Date(verification.submittedAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}`
              : "Pending submission"}
          </p>
        </div>
      </div>

      {/* Applicant Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {isEstateAgent ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}Applicant Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium mt-0.5">{tenant?.businessName || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Account Type</p><p className="font-medium mt-0.5 capitalize">{tenant?.accountType?.replace("_", " ") || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium mt-0.5">{tenant?.contactEmail || "—"}</p></div>
            <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium mt-0.5">{tenant?.contactPhone || "—"}</p></div>
            {verification?.earbExpiryDate && (
              <div><p className="text-xs text-muted-foreground">EARB Expiry</p>
                <p className={cn("font-medium mt-0.5", new Date(verification.earbExpiryDate) < new Date() ? "text-red-600" : "text-green-600")}>
                  {new Date(verification.earbExpiryDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
          {verification?.adminNotes && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800">Previous Notes</p>
              <p className="text-xs text-amber-700 mt-1">{verification.adminNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" />Submitted Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            docs.map((doc: any) => (
              <div key={doc.documentType} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{DOC_LABELS[doc.documentType] || doc.documentType}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-KE") : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", docStatusColors[doc.status] || "bg-gray-100 text-gray-600")}>
                    {doc.status}
                  </span>
                  {(doc.signedUrl || doc.url) && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={doc.signedUrl || doc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Decision */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Internal Note <span className="text-muted-foreground">(required when rejecting or requesting info)</span></Label>
            <Textarea
              placeholder="Enter notes that will be shared with the applicant…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="resize-none text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => handleDecision("approved")}
              disabled={submitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />Approve
            </Button>
            <Button
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => handleDecision("information_requested")}
              disabled={submitting}
            >
              <AlertCircle className="h-4 w-4 mr-2" />Request More Info
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDecision("rejected")}
              disabled={submitting}
            >
              <XCircle className="h-4 w-4 mr-2" />Reject
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
