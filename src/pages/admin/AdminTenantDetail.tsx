import { useState } from "react";
import { ArrowLeft, User, Home, CreditCard, AlertTriangle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MOCK_TENANT = {
  id: "1",
  name: "Grace Akinyi",
  email: "grace.a@gmail.com",
  phone: "+254 712 111 222",
  idNumber: "12345678",
  status: "Active",
  registeredOn: "2024-03-15",
  property: "Modern 2BR in Kilimani",
  agent: "Prestige Properties Ltd",
  moveIn: "2024-06-01",
  monthlyRent: 55000,
  payments: [
    { date: "2024-06-05", amount: 55000, status: "Paid", receipt: "MPESA-TEN001" },
    { date: "2024-05-05", amount: 55000, status: "Paid", receipt: "MPESA-TEN002" },
    { date: "2024-04-05", amount: 55000, status: "Paid", receipt: "MPESA-TEN003" },
    { date: "2024-03-05", amount: 55000, status: "Late", receipt: "MPESA-TEN004" },
  ],
  flags: [] as string[],
};

const TABS = ["Overview", "Payments", "Activity"] as const;

export default function AdminTenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const t = MOCK_TENANT;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/tenants")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold">{t.name}</h1>
            <Badge className={t.status === "Active" ? "bg-green-100 text-green-700 border-0" : "bg-red-100 text-red-700 border-0"}>{t.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{t.email} · {t.phone}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => toast({ title: "Tenant flagged for review" })}>
          <AlertTriangle className="h-4 w-4 mr-2" />Flag Tenant
        </Button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1.5 border-b pb-0">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn("px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === tb ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >{tb}</button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Full Name</span><span className="font-medium">{t.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{t.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{t.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">National ID</span><span className="font-medium font-mono">{t.idNumber}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Registered</span>
                <span className="font-medium">{new Date(t.registeredOn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Home className="h-4 w-4" />Current Tenancy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Property</span><span className="font-medium">{t.property}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Agent</span><span className="font-medium">{t.agent}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Move-in</span>
                <span className="font-medium">{new Date(t.moveIn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <div className="flex justify-between"><span className="text-muted-foreground">Monthly Rent</span><span className="font-medium">KES {t.monthlyRent.toLocaleString()}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "Payments" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />Payment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Date", "Amount", "Status", "Receipt"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.payments.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(p.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-xs font-medium">KES {p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === "Paid" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{p.receipt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "Activity" && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center py-8">Activity log coming soon.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
