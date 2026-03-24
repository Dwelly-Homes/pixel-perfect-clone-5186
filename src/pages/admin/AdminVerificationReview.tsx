import { useState } from "react";
import { ArrowLeft, FileText, CheckCircle2, XCircle, AlertCircle, Download, User, Building2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DocStatus = "Uploaded" | "Approved" | "Rejected";

interface Doc { name: string; filename: string; status: DocStatus; uploadedAt: string; }

const MOCK = {
  id: "1",
  name: "Prestige Properties Ltd",
  type: "Estate Agent" as const,
  email: "info@prestige.co.ke",
  phone: "+254 712 345 678",
  submitted: "2024-06-20",
  status: "Pending",
  docs: [
    { name: "National ID — Front", filename: "national_id_front.jpg", status: "Uploaded" as DocStatus, uploadedAt: "20 Jun 2024" },
    { name: "National ID — Back", filename: "national_id_back.jpg", status: "Uploaded" as DocStatus, uploadedAt: "20 Jun 2024" },
    { name: "KRA PIN Certificate", filename: "kra_pin.pdf", status: "Approved" as DocStatus, uploadedAt: "20 Jun 2024" },
    { name: "Business Registration", filename: "business_reg.pdf", status: "Uploaded" as DocStatus, uploadedAt: "20 Jun 2024" },
    { name: "EARB Certificate", filename: "earb_cert.pdf", status: "Uploaded" as DocStatus, uploadedAt: "20 Jun 2024" },
  ] as Doc[],
  earbExpiry: "2025-06-30",
};

const docStatusColors: Record<DocStatus, string> = {
  Uploaded: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function AdminVerificationReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [docs, setDocs] = useState<Doc[]>(MOCK.docs);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function toggleDoc(index: number, newStatus: DocStatus) {
    setDocs((d) => d.map((doc, i) => i === index ? { ...doc, status: newStatus } : doc));
  }

  function handleDecision(decision: "approve" | "reject" | "request_info") {
    if ((decision === "reject" || decision === "request_info") && !note.trim()) {
      toast({ title: "Note required", description: "Please provide a note explaining the decision.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      const label = decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Info Requested";
      toast({ title: `Verification ${label}`, description: `${MOCK.name} has been notified.` });
      navigate("/admin/verifications");
    }, 1200);
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/verifications")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Review Verification</h1>
          <p className="text-sm text-muted-foreground">Submitted {new Date(MOCK.submitted).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* Applicant Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {MOCK.type === "Estate Agent" ? <Building2 className="h-4 w-4" /> : <User className="h-4 w-4" />}Applicant Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium mt-0.5">{MOCK.name}</p></div>
            <div><p className="text-xs text-muted-foreground">Account Type</p><p className="font-medium mt-0.5">{MOCK.type}</p></div>
            <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium mt-0.5">{MOCK.email}</p></div>
            <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium mt-0.5">{MOCK.phone}</p></div>
            {MOCK.earbExpiry && (
              <div><p className="text-xs text-muted-foreground">EARB Expiry</p>
                <p className={cn("font-medium mt-0.5", new Date(MOCK.earbExpiry) < new Date() ? "text-red-600" : "text-green-600")}>
                  {new Date(MOCK.earbExpiry).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
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
          {docs.map((doc, i) => (
            <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">{doc.filename} · {doc.uploadedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", docStatusColors[doc.status])}>{doc.status}</span>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Viewing document", description: doc.filename })}>
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {doc.status !== "Approved" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-green-700 hover:text-green-800 hover:bg-green-50" onClick={() => toggleDoc(i, "Approved")}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve
                  </Button>
                )}
                {doc.status !== "Rejected" && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-700 hover:text-red-800 hover:bg-red-50" onClick={() => toggleDoc(i, "Rejected")}>
                    <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                  </Button>
                )}
              </div>
            </div>
          ))}
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
              onClick={() => handleDecision("approve")}
              disabled={submitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />Approve
            </Button>
            <Button
              variant="outline"
              className="text-amber-700 border-amber-300 hover:bg-amber-50"
              onClick={() => handleDecision("request_info")}
              disabled={submitting}
            >
              <AlertCircle className="h-4 w-4 mr-2" />Request More Info
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDecision("reject")}
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
