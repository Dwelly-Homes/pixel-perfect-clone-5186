import { useState } from "react";
import { TrendingUp, DollarSign, CreditCard, AlertCircle, Search, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type TxType = "Subscription" | "Commission";
type TxStatus = "Paid" | "Pending" | "Failed" | "Overdue";

interface Transaction {
  id: string;
  date: string;
  agent: string;
  agentType: "Estate Agent" | "Landlord";
  type: TxType;
  plan?: string;
  property?: string;
  amount: number;
  status: TxStatus;
  receipt: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: "1", date: "2024-06-15", agent: "Prestige Properties Ltd", agentType: "Estate Agent", type: "Subscription", plan: "Professional", amount: 4500, status: "Paid", receipt: "MPESA-ABC123" },
  { id: "2", date: "2024-06-15", agent: "KeyHomes Agency", agentType: "Estate Agent", type: "Subscription", plan: "Professional", amount: 4500, status: "Paid", receipt: "MPESA-BCD234" },
  { id: "3", date: "2024-06-14", agent: "Prestige Properties Ltd", agentType: "Estate Agent", type: "Commission", property: "Elegant 1BR in Lavington", amount: 2000, status: "Paid", receipt: "MPESA-CDE345" },
  { id: "4", date: "2024-06-13", agent: "James Kariuki", agentType: "Landlord", type: "Commission", property: "2BR in Parklands", amount: 2250, status: "Paid", receipt: "MPESA-DEF456" },
  { id: "5", date: "2024-06-12", agent: "TopFlat Agency", agentType: "Estate Agent", type: "Subscription", plan: "Starter", amount: 1500, status: "Failed", receipt: "" },
  { id: "6", date: "2024-06-11", agent: "Nairobi Realty Ltd", agentType: "Estate Agent", type: "Commission", property: "3BR in Runda", amount: 6000, status: "Paid", receipt: "MPESA-FGH678" },
  { id: "7", date: "2024-06-10", agent: "Homes Kenya Ltd", agentType: "Estate Agent", type: "Subscription", plan: "Professional", amount: 4500, status: "Paid", receipt: "MPESA-GHI789" },
  { id: "8", date: "2024-06-08", agent: "Grace Wambui", agentType: "Landlord", type: "Subscription", plan: "Starter", amount: 1500, status: "Paid", receipt: "MPESA-HIJ890" },
  { id: "9", date: "2024-06-07", agent: "FastLet Ltd", agentType: "Estate Agent", type: "Subscription", plan: "Starter", amount: 1500, status: "Overdue", receipt: "" },
  { id: "10", date: "2024-06-05", agent: "John Kimani", agentType: "Landlord", type: "Commission", property: "1BR in Ruaka", amount: 900, status: "Pending", receipt: "" },
  { id: "11", date: "2024-06-03", agent: "PrimeSpace Agency", agentType: "Estate Agent", type: "Subscription", plan: "Starter", amount: 1500, status: "Paid", receipt: "MPESA-JKL012" },
  { id: "12", date: "2024-06-01", agent: "Sarah Mutua", agentType: "Landlord", type: "Subscription", plan: "Starter", amount: 1500, status: "Paid", receipt: "MPESA-KLM123" },
];

const statusColors: Record<TxStatus, string> = {
  Paid: "bg-green-100 text-green-700",
  Pending: "bg-amber-100 text-amber-700",
  Failed: "bg-red-100 text-red-700",
  Overdue: "bg-red-200 text-red-800",
};

const planBreakdown = [
  { plan: "Enterprise", count: 1, monthlyRevenue: 0, label: "Contact Sales" },
  { plan: "Professional", count: 4, monthlyRevenue: 18000 },
  { plan: "Starter", count: 7, monthlyRevenue: 10500 },
];

export default function AdminBilling() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = TRANSACTIONS.filter((t) => {
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.agent.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRevenue = TRANSACTIONS.filter((t) => t.status === "Paid").reduce((s, t) => s + t.amount, 0);
  const subscriptionRevenue = TRANSACTIONS.filter((t) => t.type === "Subscription" && t.status === "Paid").reduce((s, t) => s + t.amount, 0);
  const commissionRevenue = TRANSACTIONS.filter((t) => t.type === "Commission" && t.status === "Paid").reduce((s, t) => s + t.amount, 0);
  const pendingRevenue = TRANSACTIONS.filter((t) => t.status === "Pending" || t.status === "Overdue").reduce((s, t) => s + t.amount, 0);

  function exportCSV() {
    const header = "Date,Agent,Type,Amount,Status,Receipt\n";
    const rows = filtered.map((t) => `${t.date},"${t.agent}",${t.type},${t.amount},${t.status},${t.receipt}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "platform-billing.csv"; a.click();
    toast({ title: "Billing report exported" });
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold">Platform Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor subscription revenue, commissions, and payment health.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1.5" />Export CSV
        </Button>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue (Jun)</p>
              <p className="text-xl font-heading font-bold">KES {totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Subscriptions</p>
              <p className="text-xl font-heading font-bold">KES {subscriptionRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commissions</p>
              <p className="text-xl font-heading font-bold">KES {commissionRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending / Overdue</p>
              <p className="text-xl font-heading font-bold">KES {pendingRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan breakdown */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Subscription Plan Breakdown</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {planBreakdown.map((p) => (
            <div key={p.plan} className="flex items-center gap-4">
              <span className="text-sm font-medium w-28 shrink-0">{p.plan}</span>
              <div className="flex-1">
                <Progress value={(p.count / 12) * 100} className="h-2" />
              </div>
              <span className="text-xs text-muted-foreground w-16 text-right">{p.count} clients</span>
              <span className="text-xs font-medium w-32 text-right">
                {p.monthlyRevenue ? `KES ${p.monthlyRevenue.toLocaleString()}/mo` : p.label}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search agent…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-52" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="Transaction type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Subscription">Subscriptions</SelectItem>
            <SelectItem value="Commission">Commissions</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 text-xs w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} transactions</span>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Date", "Agent / Landlord", "Account Type", "Transaction", "Amount", "Status", "Receipt"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(t.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">{t.agent}</td>
                  <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{t.agentType}</span></td>
                  <td className="px-4 py-3">
                    <p className="text-xs">{t.type}</p>
                    {t.plan && <p className="text-[10px] text-muted-foreground">{t.plan} Plan</p>}
                    {t.property && <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{t.property}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold">KES {t.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[t.status])}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.receipt || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No transactions found.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
