import { useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle2, AlertCircle, Download, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CommStatus = "Pending" | "Paid" | "Disputed" | "Waived";

interface Commission {
  id: string;
  property: string;
  tenant: string;
  moveInDate: string;
  monthlyRent: number;
  commissionRate: number;
  amount: number;
  status: CommStatus;
  dueDate: string;
  paidDate?: string;
  receipt?: string;
}

const COMMISSIONS: Commission[] = [
  { id: "1", property: "Modern 2BR in Kilimani", tenant: "Grace Akinyi", moveInDate: "2024-06-01", monthlyRent: 55000, commissionRate: 5, amount: 2750, status: "Pending", dueDate: "2024-07-01" },
  { id: "2", property: "Elegant 1BR in Lavington", tenant: "David Kamau", moveInDate: "2024-05-15", monthlyRent: 40000, commissionRate: 5, amount: 2000, status: "Paid", dueDate: "2024-06-15", paidDate: "2024-06-18", receipt: "MPESA-COM001" },
  { id: "3", property: "Cozy Studio in Westlands", tenant: "Sarah Njeri", moveInDate: "2024-04-01", monthlyRent: 25000, commissionRate: 5, amount: 1250, status: "Paid", dueDate: "2024-05-01", paidDate: "2024-05-03", receipt: "MPESA-COM002" },
  { id: "4", property: "Spacious 3BR in Runda", tenant: "Peter Odhiambo", moveInDate: "2024-06-10", monthlyRent: 120000, commissionRate: 3, amount: 3600, status: "Pending", dueDate: "2024-07-10" },
  { id: "5", property: "Modern 2BR in Kilimani", tenant: "Amina Hassan", moveInDate: "2024-03-01", monthlyRent: 55000, commissionRate: 5, amount: 2750, status: "Disputed", dueDate: "2024-04-01" },
  { id: "6", property: "Studio in Ngong Road", tenant: "James Mwangi", moveInDate: "2024-02-15", monthlyRent: 18000, commissionRate: 5, amount: 900, status: "Waived", dueDate: "2024-03-15" },
];

const TABS: CommStatus[] = ["Pending", "Paid", "Disputed", "Waived"];

const statusConfig: Record<CommStatus, { color: string; bg: string; icon: React.ElementType }> = {
  Pending: { color: "text-amber-700", bg: "bg-amber-100", icon: Clock },
  Paid: { color: "text-green-700", bg: "bg-green-100", icon: CheckCircle2 },
  Disputed: { color: "text-red-700", bg: "bg-red-100", icon: AlertCircle },
  Waived: { color: "text-gray-600", bg: "bg-gray-100", icon: CheckCircle2 },
};

export default function Commissions() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"All" | CommStatus>("All");
  const [search, setSearch] = useState("");

  const filtered = COMMISSIONS.filter((c) => {
    if (tab !== "All" && c.status !== tab) return false;
    if (search && !c.property.toLowerCase().includes(search.toLowerCase()) && !c.tenant.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPending = COMMISSIONS.filter((c) => c.status === "Pending").reduce((s, c) => s + c.amount, 0);
  const totalPaid = COMMISSIONS.filter((c) => c.status === "Paid").reduce((s, c) => s + c.amount, 0);
  const totalDisputed = COMMISSIONS.filter((c) => c.status === "Disputed").reduce((s, c) => s + c.amount, 0);

  function handlePay(c: Commission) {
    toast({ title: "M-Pesa payment initiated", description: `Commission of KES ${c.amount.toLocaleString()} for ${c.property}` });
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Commissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Track and manage move-in commissions from tenants.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-xl font-heading font-bold">KES {totalPending.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{COMMISSIONS.filter((c) => c.status === "Pending").length} commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Paid this year</p>
                <p className="text-xl font-heading font-bold">KES {totalPaid.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{COMMISSIONS.filter((c) => c.status === "Paid").length} commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Disputed</p>
                <p className="text-xl font-heading font-bold">KES {totalDisputed.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{COMMISSIONS.filter((c) => c.status === "Disputed").length} commissions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(["All", ...TABS] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground")}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search property or tenant…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-60" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Property", "Tenant", "Move-in Date", "Rent", "Rate", "Commission", "Due Date", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sc = statusConfig[c.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs font-medium max-w-[160px] truncate">{c.property}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.tenant}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.moveInDate).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-xs">KES {c.monthlyRent.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.commissionRate}%</td>
                    <td className="px-4 py-3 text-xs font-semibold">KES {c.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.dueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit", sc.bg, sc.color)}>
                        <StatusIcon className="h-3 w-3" />{c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.status === "Pending" && (
                        <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => handlePay(c)}>
                          Pay via M-Pesa
                        </Button>
                      )}
                      {c.status === "Paid" && c.receipt && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Receipt", description: c.receipt })}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {c.status === "Disputed" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast({ title: "Support contacted", description: "Our team will follow up within 24 hours." })}>
                          Contact Support
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No commissions found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
