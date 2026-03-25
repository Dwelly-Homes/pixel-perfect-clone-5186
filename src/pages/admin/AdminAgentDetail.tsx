import { useState } from "react";
import { ArrowLeft, Building2, Users, CreditCard, ShieldCheck, MapPin, Mail, Phone, Globe, AlertTriangle, CheckCircle2, UserX, UserCheck } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MOCK = {
  id: "1",
  name: "Prestige Properties Ltd",
  email: "info@prestige.co.ke",
  phone: "+254 712 345 678",
  website: "www.prestigeproperties.co.ke",
  address: "Westlands Business Park, Nairobi",
  earbNumber: "EARB/2021/0042",
  earbExpiry: "2024-07-15",
  plan: "Professional",
  planPrice: 4500,
  planRenewal: "2024-07-15",
  status: "Active",
  joinedOn: "2021-03-15",
  listings: 24,
  occupiedListings: 18,
  availableListings: 6,
  teamCount: 7,
  teamAllowed: 10,
  totalRevenue: 162000,
  commissionsPaid: 18000,
  subscriptionsPaid: 54000,
  team: [
    { name: "James Mwenda", email: "j.mwenda@prestige.co.ke", role: "Admin", status: "Active" },
    { name: "Alice Njoki", email: "a.njoki@prestige.co.ke", role: "Agent", status: "Active" },
    { name: "Brian Oloo", email: "b.oloo@prestige.co.ke", role: "Agent", status: "Active" },
    { name: "Carol Wainaina", email: "c.wainaina@prestige.co.ke", role: "Caretaker", status: "Active" },
  ],
  listings_data: [
    { id: "1", title: "Modern 2BR in Kilimani", area: "Kilimani", rent: 55000, status: "Occupied", tenant: "Grace Akinyi" },
    { id: "2", title: "Elegant 1BR in Lavington", area: "Lavington", rent: 40000, status: "Occupied", tenant: "David Kamau" },
    { id: "3", title: "Studio in Westlands", area: "Westlands", rent: 25000, status: "Available", tenant: "" },
    { id: "4", title: "3BR in Karen", area: "Karen", rent: 120000, status: "Occupied", tenant: "Peter Odhiambo" },
  ],
  billing: [
    { date: "2024-06-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Paid", receipt: "MPESA-ABC123" },
    { date: "2024-05-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Paid", receipt: "MPESA-DEF456" },
    { date: "2024-05-10", desc: "Commission — Elegant 1BR", amount: 2000, status: "Paid", receipt: "MPESA-GHI789" },
    { date: "2024-04-15", desc: "Professional Plan — Monthly", amount: 4500, status: "Paid", receipt: "MPESA-JKL012" },
  ],
};

const TABS = ["Overview", "Listings", "Team", "Billing", "Verification"] as const;

export default function AdminAgentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("Overview");
  const a = MOCK;

  const occupancyRate = Math.round((a.occupiedListings / a.listings) * 100);
  const daysLeft = Math.ceil((new Date(a.earbExpiry).getTime() - new Date("2024-06-21").getTime()) / 86400000);

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/agents")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-heading font-bold">{a.name}</h1>
            <Badge className={a.status === "Active" ? "bg-green-100 text-green-700 border-0" : "bg-red-100 text-red-700 border-0"}>{a.status}</Badge>
            <Badge variant="outline" className="text-xs">{a.plan} Plan</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{a.email} · Member since {new Date(a.joinedOn).toLocaleDateString("en-KE", { month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {a.status === "Active" ? (
            <Button variant="destructive" size="sm" onClick={() => toast({ title: "Agent suspended", description: a.name })}>
              <UserX className="h-4 w-4 mr-2" />Suspend
            </Button>
          ) : (
            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => toast({ title: "Agent reinstated", description: a.name })}>
              <UserCheck className="h-4 w-4 mr-2" />Reinstate
            </Button>
          )}
        </div>
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

      {/* Overview */}
      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total Listings", value: a.listings, icon: Building2 },
              { label: "Occupied", value: `${occupancyRate}%`, icon: CheckCircle2 },
              { label: "Team Members", value: `${a.teamCount}/${a.teamAllowed}`, icon: Users },
              { label: "Total Revenue", value: `KES ${a.totalRevenue.toLocaleString()}`, icon: CreditCard },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <s.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-lg font-heading font-bold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Contact & Location</CardTitle></CardHeader>
              <CardContent className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{a.email}</div>
                <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{a.phone}</div>
                <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{a.website}</div>
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{a.address}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Occupancy & Listings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Occupancy rate</span>
                    <span className="font-medium">{a.occupiedListings} / {a.listings} occupied</span>
                  </div>
                  <Progress value={occupancyRate} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Plan listing allowance</span>
                    <span className="font-medium">{a.listings} / 50 used</span>
                  </div>
                  <Progress value={(a.listings / 50) * 100} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2 bg-muted/40 rounded text-center">
                    <p className="text-xs text-muted-foreground">Subscriptions paid</p>
                    <p className="text-sm font-semibold">KES {a.subscriptionsPaid.toLocaleString()}</p>
                  </div>
                  <div className="p-2 bg-muted/40 rounded text-center">
                    <p className="text-xs text-muted-foreground">Commissions paid</p>
                    <p className="text-sm font-semibold">KES {a.commissionsPaid.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* EARB Warning */}
          {daysLeft <= 30 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">EARB Certificate {daysLeft < 0 ? "Expired" : "Expiring Soon"}</p>
                <p className="text-sm text-amber-700">
                  {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago.` : `Expires in ${daysLeft} days.`} EARB No: {a.earbNumber}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Listings */}
      {tab === "Listings" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Property", "Area", "Monthly Rent", "Status", "Tenant"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.listings_data.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs font-medium">{l.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.area}</td>
                    <td className="px-4 py-3 text-xs font-medium">KES {l.rent.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", l.status === "Occupied" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{l.tenant || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Team */}
      {tab === "Team" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Name", "Email", "Role", "Status"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {a.team.map((m, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3 text-xs font-medium">{m.name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{m.role}</span></td>
                    <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Billing */}
      {tab === "Billing" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Current Plan</p><p className="font-heading font-bold text-lg mt-1">{a.plan}</p><p className="text-xs text-muted-foreground">KES {a.planPrice.toLocaleString()}/mo</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Next Renewal</p><p className="font-heading font-bold text-lg mt-1">{new Date(a.planRenewal).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Total Paid</p><p className="font-heading font-bold text-lg mt-1">KES {a.totalRevenue.toLocaleString()}</p></CardContent></Card>
          </div>
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
                  {a.billing.map((b, i) => (
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
        </div>
      )}

      {/* Verification */}
      {tab === "Verification" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Verification Approved</p>
                <p className="text-xs text-green-700">All documents verified. Account is fully active.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-muted-foreground">EARB Number</p><p className="font-mono font-medium mt-0.5">{a.earbNumber}</p></div>
              <div><p className="text-xs text-muted-foreground">EARB Expiry</p>
                <p className={cn("font-medium mt-0.5", daysLeft < 0 ? "text-red-600" : daysLeft <= 30 ? "text-amber-600" : "text-green-600")}>
                  {new Date(a.earbExpiry).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
                  {daysLeft < 0 ? " (Expired)" : daysLeft <= 30 ? ` (${daysLeft}d left)` : ""}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Renewal reminder sent", description: a.name })}>
              Send EARB Renewal Reminder
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
