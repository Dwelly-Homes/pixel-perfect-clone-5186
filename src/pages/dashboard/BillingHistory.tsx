import { useState } from "react";
import { ArrowLeft, Download, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const ALL_TRANSACTIONS = [
  { id: "1", date: "2024-06-15", desc: "Professional Plan — Monthly", type: "Subscription", property: "", amount: 4500, status: "Success", receipt: "MPESA-ABC123" },
  { id: "2", date: "2024-06-10", desc: "Commission — Elegant 1BR in Lavington", type: "Commission", property: "Elegant 1BR in Lavington", amount: 3200, status: "Success", receipt: "MPESA-BCD234" },
  { id: "3", date: "2024-05-15", desc: "Professional Plan — Monthly", type: "Subscription", property: "", amount: 4500, status: "Success", receipt: "MPESA-CDE345" },
  { id: "4", date: "2024-05-08", desc: "Commission — Cozy Studio in Westlands", type: "Commission", property: "Cozy Studio in Westlands", amount: 1875, status: "Failed", receipt: "" },
  { id: "5", date: "2024-04-15", desc: "Professional Plan — Monthly", type: "Subscription", property: "", amount: 4500, status: "Success", receipt: "MPESA-EFG567" },
  { id: "6", date: "2024-04-05", desc: "Commission — Modern 2BR in Kilimani", type: "Commission", property: "Modern 2BR in Kilimani", amount: 5000, status: "Success", receipt: "MPESA-FGH678" },
  { id: "7", date: "2024-03-15", desc: "Professional Plan — Monthly", type: "Subscription", property: "", amount: 4500, status: "Success", receipt: "MPESA-GHI789" },
  { id: "8", date: "2024-02-15", desc: "Starter Plan — Monthly", type: "Subscription", property: "", amount: 1500, status: "Success", receipt: "MPESA-HIJ890" },
];

const TYPE_FILTERS = ["All", "Subscriptions", "Commissions", "Failed"];

export default function BillingHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const filtered = ALL_TRANSACTIONS.filter((t) => {
    if (typeFilter === "Subscriptions" && t.type !== "Subscription") return false;
    if (typeFilter === "Commissions" && t.type !== "Commission") return false;
    if (typeFilter === "Failed" && t.status !== "Failed") return false;
    if (fromDate && t.date < fromDate) return false;
    if (toDate && t.date > toDate) return false;
    return true;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const totalThisMonth = ALL_TRANSACTIONS.filter((t) => t.date.startsWith("2024-06") && t.status === "Success").reduce((s, t) => s + t.amount, 0);

  function exportCSV() {
    const header = "Date,Description,Type,Amount,Status,Receipt\n";
    const rows = filtered.map((t) => `${t.date},"${t.desc}",${t.type},${t.amount},${t.status},${t.receipt}`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "payment-history.csv"; a.click();
    toast({ title: "CSV exported" });
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/billing")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-heading font-bold">Payment History</h1>
            <p className="text-sm text-muted-foreground">Total paid this month: <strong>KES {totalThisMonth.toLocaleString()}</strong></p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <FileDown className="h-4 w-4 mr-1.5" />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5 flex-wrap">
          {TYPE_FILTERS.map((f) => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", typeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground")}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-xs w-36" />
          <span className="text-xs text-muted-foreground">to</span>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-xs w-36" />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {["Date & Time","Description","Type","Amount","M-Pesa Receipt","Status",""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((t) => (
                <tr key={t.id} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(t.date).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="px-4 py-3 text-xs max-w-[200px] truncate">{t.desc}</td>
                  <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{t.type}</span></td>
                  <td className="px-4 py-3 text-xs font-semibold">KES {t.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.receipt || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.status === "Success" ? "bg-green-100 text-green-700" : t.status === "Failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {t.receipt && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast({ title: "Receipt downloaded", description: t.receipt })}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {paginated.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No transactions found.</p>}
        </CardContent>
      </Card>

      {paginated.length < filtered.length && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Load more</Button>
        </div>
      )}
    </div>
  );
}
