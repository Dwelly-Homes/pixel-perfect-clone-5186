import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface UnitOption {
  id: string;
  label: string;  // e.g. "A01 · 1 Bedroom · KES 25,000"
  status: "vacant" | "occupied";
}

interface InquiryModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
  agentName: string;
  /** When provided, shows a unit selector dropdown */
  units?: UnitOption[];
  /** Pre-select a specific unit (e.g. when clicking "Inquire" on a unit row) */
  preselectedUnitId?: string;
}

export function InquiryModal({
  open,
  onClose,
  propertyId,
  propertyTitle,
  agentName,
  units,
  preselectedUnitId,
}: InquiryModalProps) {
  const { user, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`I am interested in this property: ${propertyTitle}`);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(preselectedUnitId ?? "none");
  const [submitting, setSubmitting] = useState(false);

  // Sync preselection when modal opens or prop changes
  useEffect(() => {
    setSelectedUnitId(preselectedUnitId ?? "none");
  }, [preselectedUnitId, open]);

  const hasUnits = units && units.length > 0;
  const vacantUnits = units?.filter((u) => u.status === "vacant") ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const senderName = isAuthenticated ? user!.fullName : name;
    const senderPhone = isAuthenticated ? user!.phone : `+254${phone.replace(/^0/, "")}`;
    const senderEmail = isAuthenticated ? user!.email : (email || undefined);

    if (!isAuthenticated && (!name || !phone)) return;

    setSubmitting(true);
    try {
      await api.post("/inquiries", {
        propertyId,
        ...(selectedUnitId && selectedUnitId !== "none" ? { unitId: selectedUnitId } : {}),
        inquiryType: "general",
        senderName,
        senderPhone,
        senderEmail,
        message,
      });
      toast.success("Your inquiry has been sent! The agent will contact you shortly.");
      onClose();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Send Inquiry</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-body mb-2">
          Contact <strong>{agentName}</strong> about this property
        </p>

        {isAuthenticated ? (
          <div className="rounded-md bg-muted px-4 py-3 mb-2 text-sm font-body text-muted-foreground">
            Sending as <strong className="text-foreground">{user!.fullName}</strong>
            {user!.phone && <> &middot; {user!.phone}</>}
            {" "}&middot; {user!.email}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAuthenticated && (
            <>
              <div>
                <Label className="font-body">Full Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label className="font-body">Phone Number *</Label>
                <div className="flex mt-1">
                  <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+254</span>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="7XX XXX XXX"
                    required
                    className="rounded-l-none"
                  />
                </div>
              </div>
              <div>
                <Label className="font-body">Email (optional)</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1" />
              </div>
            </>
          )}

          {hasUnits && (
            <div>
              <Label className="font-body">Specific Unit (optional)</Label>
              <Select
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Entire property (any unit)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Entire property (any unit)</SelectItem>
                  {vacantUnits.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="font-body">Message</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className="mt-1" />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-secondary py-2.5 text-sm font-body font-medium text-secondary-foreground hover:bg-orange-dark transition-colors disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Sending..." : "Submit Inquiry"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
