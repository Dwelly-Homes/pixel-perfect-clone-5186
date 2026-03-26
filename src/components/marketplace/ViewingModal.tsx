import { useState } from "react";
import { Calendar, Clock, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ViewingModalProps {
  open: boolean;
  onClose: () => void;
  propertyId: string;
  propertyTitle: string;
}

const TIME_SLOTS = [
  { label: "Morning (8am–12pm)", value: "morning" },
  { label: "Afternoon (12pm–5pm)", value: "afternoon" },
  { label: "Evening (5pm–7pm)", value: "evening" },
];

export function ViewingModal({ open, onClose, propertyId, propertyTitle }: ViewingModalProps) {
  const { user, isAuthenticated } = useAuth();

  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !timeSlot) return;
    if (!isAuthenticated && !phone) return;

    const senderName = isAuthenticated ? user!.fullName : (name || "Anonymous");
    const senderPhone = isAuthenticated ? user!.phone : `+254${phone.replace(/^0/, "")}`;

    setSubmitting(true);
    try {
      await api.post("/inquiries", {
        propertyId,
        inquiryType: "viewing_request",
        senderName,
        senderPhone,
        message: `Viewing request for: ${propertyTitle}`,
        requestedDate: new Date(date).toISOString(),
        requestedTimeSlot: timeSlot,
      });
      toast.success("Viewing request submitted! You'll be contacted to confirm.");
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
          <DialogTitle className="font-heading">Request a Viewing</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground font-body mb-2">
          Schedule a visit for <strong>{propertyTitle}</strong>
        </p>

        {isAuthenticated ? (
          <div className="rounded-md bg-muted px-4 py-3 mb-2 text-sm font-body text-muted-foreground">
            Booking as <strong className="text-foreground">{user!.fullName}</strong>
            {user!.phone && <> &middot; {user!.phone}</>}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAuthenticated && (
            <>
              <div>
                <Label className="font-body">Your Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="mt-1" />
              </div>
              <div>
                <Label className="font-body">Phone Number *</Label>
                <div className="flex mt-1">
                  <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+254</span>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="7XX XXX XXX" required className="rounded-l-none" />
                </div>
              </div>
            </>
          )}
          <div>
            <Label className="font-body flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Preferred Date *
            </Label>
            <Input type="date" min={today} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label className="font-body flex items-center gap-2">
              <Clock className="h-4 w-4" /> Time Slot *
            </Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setTimeSlot(slot.value)}
                  className={`rounded-md border px-3 py-2 text-sm text-left font-body transition-colors ${
                    timeSlot === slot.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-secondary py-2.5 text-sm font-body font-medium text-secondary-foreground hover:bg-orange-dark transition-colors disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Request Viewing"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
