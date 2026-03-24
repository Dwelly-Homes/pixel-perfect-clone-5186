import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export default function InviteMember() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Agent" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Full name is required.";
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Invitation sent!", description: `Invitation sent to ${form.email}` });
      navigate("/dashboard/team");
    }, 1200);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/team")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">Invite Team Member</h1>
          <p className="text-sm text-muted-foreground">Send an invitation to join your organization.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invitation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="e.g. Alice Wanjiku"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. alice@agency.co.ke"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-3">
              <Label>Role</Label>
              <RadioGroup
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
                className="space-y-3"
              >
                <label className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${form.role === "Agent" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}>
                  <RadioGroupItem value="Agent" id="role-agent" className="mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Agent Staff</p>
                    <p className="text-xs text-muted-foreground">Can create and manage property listings. Cannot access billing or settings.</p>
                  </div>
                </label>
                <label className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${form.role === "Caretaker" ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30"}`}>
                  <RadioGroupItem value="Caretaker" id="role-caretaker" className="mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Caretaker</p>
                    <p className="text-xs text-muted-foreground">Can view assigned properties and log maintenance updates only.</p>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-secondary/90"
            >
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span>
              ) : (
                <span className="flex items-center gap-2"><Send className="h-4 w-4" />Send Invitation</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <p>The invited person will receive an email with a link to set up their account. The link expires in 48 hours.</p>
      </div>
    </div>
  );
}
