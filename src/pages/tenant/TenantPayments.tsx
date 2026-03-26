import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard, Search, MessageSquare, Info,
  TrendingUp, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";

export default function TenantPayments() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground font-body text-sm">
          Track your rent payments and payment history.
        </p>
      </div>

      {/* Stats — all zero until lease is active */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Paid",      value: "KES 0",   icon: TrendingUp,  iconColor: "text-green-600" },
          { label: "Next Due",        value: "—",        icon: Clock,       iconColor: "text-secondary" },
          { label: "Payments Made",   value: "0",        icon: CheckCircle2,iconColor: "text-blue-500" },
          { label: "Upcoming",        value: "None",     icon: AlertTriangle,iconColor: "text-amber-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-xl font-bold font-heading text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info card */}
      <Card className="border-blue-200 bg-blue-50/40">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-sm text-foreground">
              Rent payments are handled directly with your landlord or agent
            </p>
            <p className="text-sm text-muted-foreground font-body">
              Once you move into a property sourced through Dwelly, your rent payment
              history will appear here. Payment tracking is activated when your agent
              records your move-in date.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Empty Payment History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center text-center gap-4">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <CreditCard className="h-7 w-7 text-muted-foreground opacity-40" />
          </div>
          <div>
            <p className="font-medium text-sm">No payment records yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Your payment history will appear here once you are in an active tenancy
              tracked on Dwelly.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <Button size="sm" asChild className="bg-secondary hover:bg-secondary/90">
              <Link to="/"><Search className="h-4 w-4 mr-2" />Browse Properties</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link to="/tenant/messages"><MessageSquare className="h-4 w-4 mr-2" />Message Agent</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
