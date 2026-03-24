import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CreditCard, TrendingUp, AlertCircle, ArrowRight, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";

export default function Billing() {
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ["billingOverview"],
    queryFn: async () => {
      const { data } = await api.get("/payment/billing/overview");
      return data.data;
    },
  });

  const { data: historyData } = useQuery({
    queryKey: ["billingHistory"],
    queryFn: async () => {
      const { data } = await api.get("/payment/billing/history?limit=5");
      return data.data || [];
    },
  });

  const plan = overviewData?.plan;
  const usage = overviewData?.usage;
  const daysToRenewal = plan?.renewalDate
    ? Math.ceil((new Date(plan.renewalDate).getTime() - Date.now()) / 86400000)
    : null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions: any[] = historyData || [];

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your subscription and payment history.</p>
        </div>
        <Button asChild className="bg-secondary hover:bg-secondary/90">
          <Link to="/dashboard/billing/plans">Upgrade Plan <ArrowRight className="h-4 w-4 ml-1" /></Link>
        </Button>
      </div>

      {overviewLoading ? (
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      ) : plan ? (
        <>
          {/* Current Plan */}
          <Card className="border-2 border-secondary/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />Current Plan
                </CardTitle>
                <Badge variant="secondary">{plan.name}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Monthly Fee</p><p className="font-semibold mt-0.5">KES {plan.price?.toLocaleString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Period</p><p className="font-semibold mt-0.5">Monthly</p></div>
                <div><p className="text-xs text-muted-foreground">Next Renewal</p>
                  <p className={`font-semibold mt-0.5 ${daysToRenewal !== null && daysToRenewal <= 7 ? "text-amber-600" : ""}`}>
                    {plan.renewalDate ? new Date(plan.renewalDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "—"}
                    {daysToRenewal !== null && <span className="text-xs text-muted-foreground ml-1">({daysToRenewal}d)</span>}
                  </p>
                </div>
                <div><p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={plan.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} variant="outline">
                    {plan.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {usage && (
                <div className="space-y-3 pt-2 border-t">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Listings Used</span>
                      <span className="font-medium">{usage.listingsUsed}/{usage.listingsAllowed}</span>
                    </div>
                    <Progress value={usage.listingsAllowed > 0 ? (usage.listingsUsed / usage.listingsAllowed) * 100 : 0} className="h-1.5" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Team Members</span>
                      <span className="font-medium">{usage.membersUsed}/{usage.membersAllowed}</span>
                    </div>
                    <Progress value={usage.membersAllowed > 0 ? (usage.membersUsed / usage.membersAllowed) * 100 : 0} className="h-1.5" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {daysToRenewal !== null && daysToRenewal <= 7 && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">Renewal Due Soon</p>
                <p className="text-sm text-amber-700">Your subscription renews in {daysToRenewal} day{daysToRenewal !== 1 ? "s" : ""}. Ensure your M-Pesa number is up to date.</p>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No active plan</p>
            <p className="text-sm text-muted-foreground mb-4">Choose a plan to start listing properties on Dwelly.</p>
            <Button asChild className="bg-secondary hover:bg-secondary/90">
              <Link to="/dashboard/billing/plans">View Plans</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No transactions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  {["Date", "Description", "Amount", "Status", "Receipt"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {transactions.map((t: any, i: number) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(t.date || t.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-xs">{t.description || t.desc || "—"}</td>
                    <td className="px-4 py-3 text-xs font-medium">KES {(t.amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        t.status === "success" || t.status === "Success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{t.receipt || t.mpesaReceiptNumber || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
