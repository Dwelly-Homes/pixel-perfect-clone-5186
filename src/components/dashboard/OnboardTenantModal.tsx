import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus, Loader2, Search, X, CheckCircle2, Users, UserCheck } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  property: { _id: string; title: string; monthlyRent: number };
}

interface SearcherResult {
  _id: string;
  fullName: string;
  phone: string;
  email: string;
}

export function OnboardTenantModal({ open, onClose, property }: Props) {
  const queryClient = useQueryClient();

  // Mode: "search" = find existing user, "manual" = fill details manually
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [selectedUser, setSelectedUser] = useState<SearcherResult | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearcherResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [rent, setRent] = useState(String(property.monthlyRent));
  const [deposit, setDeposit] = useState(String(property.monthlyRent));
  const [leaseStart, setLeaseStart] = useState(new Date().toISOString().split("T")[0]);
  const [leaseEnd, setLeaseEnd] = useState("");
  const [notes, setNotes] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setMode("search");
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
      setName(""); setPhone(""); setEmail("");
      setRent(String(property.monthlyRent));
      setDeposit(String(property.monthlyRent));
      setLeaseStart(new Date().toISOString().split("T")[0]);
      setLeaseEnd(""); setNotes("");
    }
  }, [open, property.monthlyRent]);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await api.get(`/users/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data?.data ?? []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchQuery]);

  function selectUser(user: SearcherResult) {
    setSelectedUser(user);
    setName(user.fullName);
    setPhone(user.phone.replace(/^\+254/, ""));
    setEmail(user.email);
    setSearchQuery("");
    setSearchResults([]);
  }

  function clearSelectedUser() {
    setSelectedUser(null);
    setName(""); setPhone(""); setEmail("");
  }

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/leases", {
        propertyId: property._id,
        occupantName: name,
        occupantPhone: phone.startsWith("+") ? phone : `+254${phone.replace(/^0/, "")}`,
        occupantEmail: email || undefined,
        monthlyRent: Number(rent),
        depositAmount: Number(deposit),
        leaseStart,
        leaseEnd: leaseEnd || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProperties"] });
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      toast.success(`Tenant onboarded for ${property.title}`);
      onClose();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone || !rent || !leaseStart) return;
    mutation.mutate();
  }

  const canSubmit = !!name && !!phone && !!rent && !!leaseStart && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-secondary" /> Onboard Tenant
          </DialogTitle>
          <DialogDescription className="font-body">
            {property.title} — this will mark the property as <strong>Occupied</strong>.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => { setMode("search"); clearSelectedUser(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors",
              mode === "search"
                ? "bg-secondary text-secondary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <Users className="h-3.5 w-3.5" /> Existing Tenant
          </button>
          <button
            type="button"
            onClick={() => { setMode("manual"); clearSelectedUser(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors border-l",
              mode === "manual"
                ? "bg-secondary text-secondary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <UserPlus className="h-3.5 w-3.5" /> New / Manual
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Search mode ── */}
          {mode === "search" && (
            <div className="space-y-3">
              {selectedUser ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{selectedUser.fullName}</p>
                    <p className="text-xs text-muted-foreground">{selectedUser.phone} · {selectedUser.email}</p>
                  </div>
                  <button type="button" onClick={clearSelectedUser} className="text-muted-foreground hover:text-foreground shrink-0">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label className="text-xs">Search by name, phone or email</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. John, 0712…, john@…"
                      className="pl-8"
                    />
                    {searching && (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="border rounded-lg divide-y shadow-sm bg-card">
                      {searchResults.map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => selectUser(u)}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs shrink-0">
                            {u.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.fullName}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.phone} · {u.email}</p>
                          </div>
                          <UserCheck className="h-4 w-4 text-secondary shrink-0 ml-auto" />
                        </button>
                      ))}
                    </div>
                  )}

                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <div className="text-center py-4 text-xs text-muted-foreground border rounded-lg">
                      No registered tenants found.{" "}
                      <button type="button" className="text-secondary underline" onClick={() => setMode("manual")}>
                        Add manually
                      </button>
                    </div>
                  )}
                </div>
              )}

              {!selectedUser && (
                <p className="text-xs text-muted-foreground text-center">
                  Can't find them?{" "}
                  <button type="button" className="text-secondary underline" onClick={() => setMode("manual")}>
                    Fill in details manually
                  </button>
                </p>
              )}
            </div>
          )}

          {/* ── Manual mode ── */}
          {mode === "manual" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Full Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tenant's full name" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone Number *</Label>
                <div className="flex">
                  <span className="flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">+254</span>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="7XX XXX XXX"
                    required
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Linked to Dwelly account if one exists.</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email (optional)</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tenant@email.com" />
              </div>
            </div>
          )}

          {/* ── Lease details (always shown once a tenant is identified) ── */}
          {(mode === "manual" || selectedUser) && (
            <>
              {selectedUser && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* show read-only fields for selected user */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">Full Name</Label>
                    <Input value={name} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input value={selectedUser.phone} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input value={selectedUser.email} disabled className="bg-muted" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Monthly Rent (KES) *</Label>
                  <Input type="number" value={rent} onChange={(e) => setRent(e.target.value)} required min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Deposit Amount (KES)</Label>
                  <Input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} min={0} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Lease Start *</Label>
                  <Input type="date" value={leaseStart} onChange={(e) => setLeaseStart(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Lease End (blank = open-ended)</Label>
                  <Input type="date" value={leaseEnd} onChange={(e) => setLeaseEnd(e.target.value)} />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="resize-none text-sm"
                    placeholder="Any additional notes about this tenancy…"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>
              Cancel
            </Button>
            {(mode === "manual" || selectedUser) && (
              <Button
                type="submit"
                disabled={!canSubmit}
                className="bg-secondary hover:bg-secondary/90"
              >
                {mutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Onboarding…</>
                  : <><UserPlus className="h-4 w-4 mr-2" />Onboard Tenant</>
                }
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
