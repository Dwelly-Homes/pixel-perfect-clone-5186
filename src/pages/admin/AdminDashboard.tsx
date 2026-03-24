import { Users, ShieldCheck, Building2, AlertTriangle, Clock, CheckCircle2, XCircle, TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Total Agents", value: "142", delta: "+8 this month", icon: Users, color: "text-blue-600 bg-blue-50" },
  { label: "Pending Verifications", value: "17", delta: "5 info requested", icon: Clock, color: "text-amber-600 bg-amber-50" },
  { label: "Active Listings", value: "834", delta: "+23 this week", icon: Building2, color: "text-green-600 bg-green-50" },
  { label: "EARB Expiring", value: "9", delta: "within 30 days", icon: AlertTriangle, color: "text-red-600 bg-red-50" },
];

const recentVerifications = [
  { id: "1", name: "Prestige Properties Ltd", type: "Estate Agent", submitted: "2024-06-20", status: "Pending" },
  { id: "2", name: "Grace Wambui", type: "Landlord", submitted: "2024-06-19", status: "Under Review" },
  { id: "3", name: "KeyHomes Agency", type: "Estate Agent", submitted: "2024-06-18", status: "Info Requested" },
  { id: "4", name: "James Kariuki", type: "Landlord", submitted: "2024-06-17", status: "Approved" },
  { id: "5", name: "Nairobi Realty Ltd", type: "Estate Agent", submitted: "2024-06-16", status: "Rejected" },
];

const recentActivity = [
  { action: "Verification approved", subject: "Grace Wambui", time: "2h ago", type: "success" },
  { action: "Info requested for", subject: "KeyHomes Agency", time: "4h ago", type: "warning" },
  { action: "Agent suspended", subject: "FastLet Ltd", time: "6h ago", type: "error" },
  { action: "New registration", subject: "Prestige Properties Ltd", time: "8h ago", type: "info" },
  { action: "EARB certificate expired", subject: "TopFlat Agency", time: "1d ago", type: "error" },
  { action: "Listing flagged", subject: "Modern 2BR in Kilimani", time: "1d ago", type: "warning" },
];

const statusColors: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-700",
  "Under Review": "bg-blue-100 text-blue-700",
  "Info Requested": "bg-orange-100 text-orange-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

const activityColors: Record<string, string> = {
  success: "bg-green-100 text-green-600",
  warning: "bg-amber-100 text-amber-600",
  error: "bg-red-100 text-red-600",
  info: "bg-blue-100 text-blue-600",
};

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform health and key metrics at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shrink-0", s.color)}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-heading font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.delta}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Verifications */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />Recent Verifications
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs text-secondary">
                  <Link to="/admin/verifications">View all <ArrowRight className="h-3 w-3 ml-1" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Name", "Type", "Submitted", "Status"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentVerifications.map((v) => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs font-medium">{v.name}</td>
                      <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium">{v.type}</span></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(v.submitted).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", statusColors[v.status])}>{v.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", activityColors[a.type])}>
                    {a.type === "success" && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {a.type === "warning" && <AlertTriangle className="h-3.5 w-3.5" />}
                    {a.type === "error" && <XCircle className="h-3.5 w-3.5" />}
                    {a.type === "info" && <TrendingUp className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{a.action} <span className="font-medium">{a.subject}</span></p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
