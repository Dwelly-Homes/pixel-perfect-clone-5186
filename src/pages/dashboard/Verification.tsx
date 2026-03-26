import { useState, useRef, useEffect } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, XCircle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

type DocStatus = "Not Uploaded" | "Uploaded" | "Approved" | "Rejected";
type VerifStatus = "not_submitted" | "documents_uploaded" | "under_review" | "information_requested" | "approved" | "rejected" | "suspended";

interface DocState { status: DocStatus; filename?: string; uploadedAt?: string; }

// Map from our local doc keys to backend document types
const DOC_KEY_TO_TYPE: Record<string, string> = {
  id_front: "national_id_front",
  id_back: "national_id_back",
  kra: "kra_pin",
  business_reg: "business_registration",
  earb: "earb_certificate",
};

const statusConfig: Record<VerifStatus, { label: string; color: string; bg: string; icon: React.ElementType; message: string }> = {
  not_submitted: { label: "Not Submitted", color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: Shield, message: "Upload your documents below and submit for review to start listing properties." },
  documents_uploaded: { label: "Documents Uploaded", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock, message: "Your documents are in the queue. We will review them within 1–2 business days." },
  under_review: { label: "Under Review", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Clock, message: "Our team is currently reviewing your documents. You will be notified of the outcome." },
  information_requested: { label: "Information Requested", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: AlertCircle, message: "Additional information is needed. Please check the notes below and resubmit." },
  approved: { label: "Approved ✓", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2, message: "Verification complete! You are now a Verified Dwelly Agent/Landlord. You can now post listings." },
  rejected: { label: "Rejected", color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle, message: "Your verification was not approved. Please review the reason below and resubmit." },
  suspended: { label: "Suspended", color: "text-red-900", bg: "bg-red-100 border-red-300", icon: XCircle, message: "Your account has been suspended. Contact support at support@dwellyhomes.co.ke" },
};

function DocUploadCard({ title, description, docState, onUpload, required = true, uploading }: {
  title: string; description: string; docState: DocState;
  onUpload: (file: File) => void; required?: boolean; uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusBadgeColor: Record<DocStatus, string> = {
    "Not Uploaded": "bg-gray-100 text-gray-600",
    Uploaded: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
  };

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are accepted (JPG, PNG, WEBP, etc.)");
      return;
    }
    onUpload(file);
  }

  return (
    <Card className={cn("border", docState.status === "Rejected" && "border-red-300")}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold">{title}{required && <span className="text-destructive ml-0.5">*</span>}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadgeColor[docState.status]}`}>{docState.status}</span>
        </div>
      </CardHeader>
      <CardContent>
        {docState.filename ? (
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs font-medium">{docState.filename}</p>
                {docState.uploadedAt && <p className="text-xs text-muted-foreground">Uploaded {docState.uploadedAt}</p>}
              </div>
            </div>
            {(docState.status === "Rejected" || docState.status === "Uploaded") && (
              <Button size="sm" variant="outline" className="text-xs h-7" disabled={uploading} onClick={() => inputRef.current?.click()}>
                Re-upload
              </Button>
            )}
          </div>
        ) : (
          <button
            type="button"
            disabled={uploading}
            className="w-full border-2 border-dashed border-border hover:border-secondary/60 rounded-lg p-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? (
              <span className="h-5 w-5 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
            <p className="text-xs text-muted-foreground">{uploading ? "Uploading…" : "Click to upload image"}</p>
            <p className="text-[10px] text-muted-foreground/70">JPG, PNG, WEBP accepted</p>
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </CardContent>
    </Card>
  );
}

export default function Verification() {
  const { user } = useAuth();
  const accountType = user?.accountType ?? "estate_agent";

  const [status, setStatus] = useState<VerifStatus>("not_submitted");
  const [adminNotes, setAdminNotes] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [earbExpiry, setEarbExpiry] = useState("");
  const [docs, setDocs] = useState<Record<string, DocState>>({
    id_front: { status: "Not Uploaded" },
    id_back: { status: "Not Uploaded" },
    kra: { status: "Not Uploaded" },
    business_reg: { status: "Not Uploaded" },
    earb: { status: "Not Uploaded" },
  });

  useEffect(() => {
    api.get("/verification/status").then(({ data }) => {
      const v = data.data;
      if (!v || v.status === "not_submitted") return;
      setStatus(v.status as VerifStatus);
      if (v.adminNotes) setAdminNotes(v.adminNotes);
      if (v.earbExpiryDate) setEarbExpiry(v.earbExpiryDate.split("T")[0]);

      // Map backend documents to local doc states
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docMap: Record<string, string> = {
        national_id_front: "id_front",
        national_id_back: "id_back",
        kra_pin: "kra",
        business_registration: "business_reg",
        earb_certificate: "earb",
      };
      const statusMap: Record<string, DocStatus> = {
        pending: "Uploaded",
        approved: "Approved",
        rejected: "Rejected",
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (v.documents?.length > 0) {
        const newDocs = { ...docs };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        v.documents.forEach((d: any) => {
          const key = docMap[d.documentType];
          if (key) {
            newDocs[key] = {
              status: statusMap[d.status] || "Uploaded",
              filename: d.documentType.replace(/_/g, " "),
              uploadedAt: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString("en-KE") : undefined,
            };
          }
        });
        setDocs(newDocs);
      }
    }).catch(() => {}); // Silently fail — user may not have a tenant account
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function uploadDoc(key: string, file: File) {
    const docType = DOC_KEY_TO_TYPE[key];
    if (!docType) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are accepted (JPG, PNG, WEBP, etc.)");
      return;
    }
    setUploadingKey(key);
    try {
      const formData = new FormData();
      formData.append("document", file);
      if (key === "earb" && earbExpiry) {
        formData.append("earbExpiryDate", earbExpiry);
      }
      await api.post(`/verification/documents/${docType}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocs((d) => ({
        ...d,
        [key]: { status: "Uploaded", filename: file.name, uploadedAt: "Now" },
      }));
      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setUploadingKey(null);
    }
  }

  const isEstateAgent = accountType === "estate_agent";
  const allRequired = isEstateAgent
    ? ["id_front", "id_back", "kra", "business_reg", "earb"]
    : ["id_front", "id_back", "kra"];

  const canSubmit = allRequired.every((k) => docs[k]?.status !== "Not Uploaded") &&
    (!isEstateAgent || earbExpiry);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await api.post("/verification/submit", isEstateAgent && earbExpiry ? { earbExpiryDate: earbExpiry } : {});
      setStatus("documents_uploaded");
      toast.success("Submitted for review", { description: "We will review your documents within 1–2 business days." });
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const cfg = statusConfig[status];
  const Icon = cfg.icon;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit your identity and license documents to get verified.</p>
      </div>

      <div className={cn("flex items-start gap-3 p-4 rounded-xl border", cfg.bg)}>
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", cfg.color)} />
        <div>
          <p className={cn("font-semibold text-sm", cfg.color)}>{cfg.label}</p>
          <p className={cn("text-sm mt-0.5", cfg.color, "opacity-90")}>{cfg.message}</p>
        </div>
      </div>

      {(status === "information_requested" || status === "rejected") && adminNotes && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Notes from our team</p>
            <p className="text-sm text-amber-700 mt-1">{adminNotes}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="font-heading font-semibold">Required Documents</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocUploadCard title="National ID — Front" description="Kenyan National Identity Card front photo" docState={docs.id_front} onUpload={(f) => uploadDoc("id_front", f)} uploading={uploadingKey === "id_front"} />
          <DocUploadCard title="National ID — Back" description="Kenyan National Identity Card back photo" docState={docs.id_back} onUpload={(f) => uploadDoc("id_back", f)} uploading={uploadingKey === "id_back"} />
        </div>

        <DocUploadCard title="KRA PIN Certificate" description="Kenya Revenue Authority Personal Identification Number certificate." docState={docs.kra} onUpload={(f) => uploadDoc("kra", f)} uploading={uploadingKey === "kra"} />

        {isEstateAgent && (
          <>
            <DocUploadCard title="Business Registration Certificate" description="Certificate of Incorporation or Business Name Registration from the Registrar of Companies." docState={docs.business_reg} onUpload={(f) => uploadDoc("business_reg", f)} uploading={uploadingKey === "business_reg"} />

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">EARB Annual Practicing Certificate<span className="text-destructive ml-0.5">*</span></CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Current annual practicing certificate from the Estate Agents Registration Board (EARB).</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${docs.earb.status === "Not Uploaded" ? "bg-gray-100 text-gray-600" : "bg-yellow-100 text-yellow-700"}`}>{docs.earb.status}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {uploadingKey === "earb" ? (
                  <div className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 opacity-60">
                    <span className="h-6 w-6 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-muted-foreground">Uploading…</p>
                  </div>
                ) : docs.earb.filename ? (
                  <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs font-medium">{docs.earb.filename}</p>
                        {docs.earb.uploadedAt && <p className="text-xs text-muted-foreground">Uploaded {docs.earb.uploadedAt}</p>}
                      </div>
                    </div>
                    {(docs.earb.status === "Rejected" || docs.earb.status === "Uploaded") && (
                      <label className="cursor-pointer">
                        <Button size="sm" variant="outline" className="text-xs h-7 pointer-events-none">Re-upload</Button>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.target.value = "";
                          if (!f) return;
                          if (!f.type.startsWith("image/")) { toast.error("Only image files are accepted (JPG, PNG, WEBP, etc.)"); return; }
                          uploadDoc("earb", f);
                        }} />
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="w-full border-2 border-dashed border-border hover:border-secondary/60 rounded-lg p-6 flex flex-col items-center gap-2 transition-colors cursor-pointer">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Click to upload EARB certificate image</p>
                    <p className="text-[10px] text-muted-foreground/70">JPG, PNG, WEBP accepted</p>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = "";
                      if (!f) return;
                      if (!f.type.startsWith("image/")) {
                        toast.error("Only image files are accepted (JPG, PNG, WEBP, etc.)");
                        return;
                      }
                      uploadDoc("earb", f);
                    }} />
                  </label>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="earb-expiry" className="text-xs">Certificate Expiry Date <span className="text-destructive">*</span></Label>
                  <Input id="earb-expiry" type="date" value={earbExpiry} onChange={(e) => setEarbExpiry(e.target.value)} className="max-w-xs" />
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">Ensure this certificate is current. Expired certificates will cause your listings to be hidden.</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Button
        className="w-full bg-secondary hover:bg-secondary/90 h-11"
        disabled={!canSubmit || submitting || status === "approved" || status === "suspended" || status === "under_review" || status === "documents_uploaded"}
        onClick={handleSubmit}
      >
        {submitting ? (
          <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Submitting…</span>
        ) : status === "approved" ? "Verification Complete"
          : (status === "documents_uploaded" || status === "under_review") ? "Submitted — Awaiting Review"
          : "Submit for Review"}
      </Button>
    </div>
  );
}
