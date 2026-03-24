import { useState } from "react";
import { ArrowLeft, Home, CreditCard, CheckCircle2, UserX, UserCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MOCK = {
  id: "2",
  name: "James Kariuki",
  email: "james.k@gmail.com",
  phone: "+254 722 300 400",
  idNumber: "23456789",
  status: "Active",
  plan: "Professional",
  planPrice: 4500,
  joinedOn: "2022-06-10",
  listings: 8,
  occupiedListings: 6,
  totalRevenue: 94500,
  subscriptionsPaid: 54000,
  commissionsPaid: 40500,
  listings_data: [
    { id: "1", title: "2BR in Parklands", area: "Parklands", rent: 45000, status: "Occupied", tenant: "Lucy Wanjiku", moveIn: "2024-01-01" },
    { id: "2", title: "1BR in South B", area: "South B", rent: 22000, status: "Occupied", tenant: "Eric Mutai", moveIn: "2024-02-15" },
    { id: "3", title: "3BR in Langata", area: "Langata", rent: 80000, status: "Occupied", tenant: "Mercy Wanjiru", moveIn: "2024-03-01" },
    { id: "4", title: "Studio in Ngong Road", area: "Ngong Road", rent: 15000, status: "Available", tenant: "", moveIn: "" },
    { id: "5", title: "2BR in Kasarani", area: "Kasarani", rent: 30000, status: "Occupied", tenant: "Tom Kariuki", moveIn: "2024-04-01" },
    { id: "6", title: "1BR in Ruaka", area: "Ruaka", rent: 18000, status: "Occupied", tenant: "Faith Njeri", moveIn: "2024-05-01" },
    { id: "7", title: "4BR in Runda", area: "Runda", rent: 150000, status: "Available", tenant: "", moveIn: "" },
    { id: "8", title: "2BR in Embakasi", area: "Embakasi", rent: 28000, status: "Occupied", tenant: "Brian Otieno", moveIn: "2024-06-01" },
  ],
  billing: [
    { date: "2024-06-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Paid", receipt: "MPESA-LL001" },
    { date: "2024-05-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Paid", receipt: "MPESA-LL002" },
    { date: "2024-05-01", desc: "Commission — 2BR Parklands", amount: 4500, status: "Paid", receipt: "MPESA-LL003" },
    { date: "2024-04-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Paid", receipt: "MPESA-LL004" },
  ],
};

const TABS = ["Overview", "Properties", "Billing"] as const;

export default function AdminLandlordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const l = MOCK;
  const occupancyRate = Math.round((l.occupiedListings / l.listings) * 100);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/landlords")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-heading font-bold">{l.name}</h1>
            <Badge className={l.status === "Active" ? "bg-green-100 text-green-700 border-0" : "bg-red-100 text-red-700 border-0"}>{l.status}</Badge>
            <Badge variant="outline" className="text-xs">{l.plan} Plan</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{l.email} · ID: {l.idNumber}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => toast({ title: "Landlord suspended", description: l.name })}>
          <UserX className="h-4 w-4 mr-2" />Suspend
        </Button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-0 border-b">
        {TABS.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={cn("px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === tb ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}>
            {tb}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Listings", value: l.listings },
              { label: "Occupancy", value: `${occupancyRate}%` },
              { label: "Total Revenue", value: `KES ${l.totalRevenue.toLocaleString()}` },
              { label: "Member Since", value: new Date(l.joinedOn).toLocaleDateString("en-KE", { month: "short", year: "numeric" }) },
            ].map((s) => (
              <Card key={s.label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-heading font-bold mt-0.5">{s.value}</p></CardContent></Card>
            ))}
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Occupancy & Revenue</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Properties occupied</span>
                  <span className="font-medium">{l.occupiedListings} / {l.listings}</span>
                </div>
                <Progress value={occupancyRate} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground">Subscriptions paid</p>
                  <p className="text-base font-semibold mt-0.5">KES {l.subscriptionsPaid.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-lg">
                  <p className="text-xs text-muted-foreground">Commissions paid</p>
                  <p className="text-base font-semibold mt-0.5">KES {l.commissionsPaid.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "Properties" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Property", "Area", "Rent/mo", "Status", "Tenant", "Move-in"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {l.listings_data.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs font-medium">{p.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.area}</td>
                    <td className="px-4 py-3 text-xs font-medium">KES {p.rent.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", p.status === "Occupied" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{p.tenant || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.moveIn ? new Date(p.moveIn).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tab === "Billing" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Date", "Description", "Amount", "Status", "Receipt"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {l.billing.map((b, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(b.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3 text-xs">{b.desc}</td>
                    <td className="px-4 py-3 text-xs font-medium">KES {b.amount.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{b.status}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{b.receipt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
