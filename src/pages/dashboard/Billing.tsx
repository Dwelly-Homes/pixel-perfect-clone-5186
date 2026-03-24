import { useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, TrendingUp, AlertCircle, Phone, Receipt, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const PLAN = { name: "Professional", price: 4500, period: "Monthly", renewal: "2024-07-15", listingsUsed: 12, listingsAllowed: 50, membersUsed: 4, membersAllowed: 10 };
const RECENT_TRANSACTIONS = [
  { date: "2024-06-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Success", receipt: "MPESA-ABC123" },
  { date: "2024-05-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Success", receipt: "MPESA-DEF456" },
  { date: "2024-05-10", desc: "Commission — Elegant 1BR in Lavington", amount: 3200, status: "Success", receipt: "MPESA-GHI789" },
  { date: "2024-04-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Success", receipt: "MPESA-JKL012" },
  { date: "2024-04-01", desc: "Commission — Cozy Studio in Westlands", amount: 1875, status: "Failed", receipt: "" },
];

export default function Billing() {
  const { toast } = useToast();
  const [phoneModal, setPhoneModal] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [phone, setPhone] = useState("0712 345 678");

  const daysToRenewal = Math.ceil((new Date(PLAN.renewal).getTime() - Date.now()) / 86400000);
  const isExpiringSoon = daysToRenewal <= 7;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your subscription and payment details.</p>
      </div>

      {isExpiringSoon && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Subscription expiring soon</p>
            <p className="text-sm text-amber-700">Your subscription expires in {daysToRenewal} days. Renew now to keep your listings active.</p>
          </div>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 shrink-0 text-white">
            Renew Now — KES {PLAN.price.toLocaleString()} via M-Pesa
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />Current Plan
              </CardTitle>
              <Badge className="bg-primary text-primary-foreground">{PLAN.name}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-3xl font-heading font-bold">KES {PLAN.price.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">/ month · {PLAN.period} billing</p>
            </div>
            <div className="text-sm text-muted-foreground">
              Renews on {new Date(PLAN.renewal).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="space-y-2.5">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Listings used</span>
                  <span className="font-medium">{PLAN.listingsUsed} / {PLAN.listingsAllowed}</span>
                </div>
                <Progress value={(PLAN.listingsUsed / PLAN.listingsAllowed) * 100} className="h-1.5" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Team members</span>
                  <span className="font-medium">{PLAN.membersUsed} / {PLAN.membersAllowed}</span>
                </div>
                <Progress value={(PLAN.membersUsed / PLAN.membersAllowed) * 100} className="h-1.5" />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button asChild size="sm" className="bg-secondary hover:bg-secondary/90">
                <Link to="/dashboard/billing/plans">Change Plan</Link>
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground text-xs" onClick={() => setCancelDialog(true)}>Cancel Plan</Button>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Phone className="h-4 w-4" />Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm shrink-0">M</div>
              <div>
                <p className="font-medium text-sm">M-Pesa</p>
                <p className="text-xs text-muted-foreground">07XX XXX {phone.slice(-3)}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Payments are processed via M-Pesa STK Push. You'll receive a prompt on your phone to confirm each payment.</p>
            <Button size="sm" variant="outline" onClick={() => setPhoneModal(true)}>
              Update Payment Phone
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4" />Recent Transactions
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-xs text-secondary">
              <Link to="/dashboard/billing/history">View Full History <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Date","Description","Amount","Status","Receipt"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RECENT_TRANSACTIONS.map((t, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</td>
                  <td className="px-4 py-3 text-xs max-w-[180px] truncate">{t.desc}</td>
                  <td className="px-4 py-3 text-xs font-medium">KES {t.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === "Success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{t.receipt || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Update Phone Modal */}
      <Dialog open={phoneModal} onOpenChange={setPhoneModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Update M-Pesa Number</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-sm">M-Pesa Phone Number</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setPhoneModal(false)}>Cancel</Button>
            <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => { setPhoneModal(false); toast({ title: "Phone number updated" }); }}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancel Subscription</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-2">Are you sure you want to cancel? Your plan will remain active until {new Date(PLAN.renewal).toLocaleDateString("en-KE", { day: "numeric", month: "long" })} and your listings may be hidden after that date.</p>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setCancelDialog(false)}>Keep Plan</Button>
            <Button variant="destructive" size="sm" onClick={() => { setCancelDialog(false); toast({ title: "Subscription cancelled", variant: "destructive" }); }}>Cancel Subscription</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
