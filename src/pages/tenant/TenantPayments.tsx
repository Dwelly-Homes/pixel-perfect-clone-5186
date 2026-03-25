import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Home,
  Bell,
  Smartphone,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
  Download,
  CreditCard,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Loader2,
  ChevronRight,
  FileText,
} from "lucide-react";

const paymentHistory = [
  { id: "TXN-20250301", date: "Mar 01, 2025", property: "2BR Apartment, Kilimani", amount: "KES 65,000", method: "M-Pesa", mpesaCode: "SHL4K7X9QR", status: "completed" },
  { id: "TXN-20250201", date: "Feb 01, 2025", property: "2BR Apartment, Kilimani", amount: "KES 65,000", method: "M-Pesa", mpesaCode: "QKL3M8N2WP", status: "completed" },
  { id: "TXN-20250101", date: "Jan 01, 2025", property: "2BR Apartment, Kilimani", amount: "KES 65,000", method: "M-Pesa", mpesaCode: "RJH9T5V1XZ", status: "completed" },
  { id: "TXN-20241201", date: "Dec 01, 2024", property: "2BR Apartment, Kilimani", amount: "KES 65,000", method: "M-Pesa", mpesaCode: "PLM6Y2C8BQ", status: "completed" },
  { id: "TXN-20241101", date: "Nov 01, 2024", property: "2BR Apartment, Kilimani", amount: "KES 65,000", method: "M-Pesa", mpesaCode: "WNK4R7F3DT", status: "failed" },
  { id: "TXN-20241002", date: "Nov 02, 2024", property: "2BR Apartment, Kilimani", amount: "KES 65,000", method: "M-Pesa", mpesaCode: "GHJ1S9L5MX", status: "completed" },
];

const upcomingPayments = [
  { property: "2BR Apartment, Kilimani", amount: 65000, dueDate: "Apr 01, 2025", daysLeft: 8, status: "upcoming" },
];

type PaymentStep = "form" | "confirm" | "processing" | "success" | "failed";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  pending: { label: "Pending", variant: "secondary", icon: Clock },
  failed: { label: "Failed", variant: "destructive", icon: XCircle },
};

export default function TenantPayments() {
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<typeof paymentHistory[0] | null>(null);
  const [payStep, setPayStep] = useState<PaymentStep>("form");
  const [phoneNumber, setPhoneNumber] = useState("0712345678");
  const [paymentAmount, setPaymentAmount] = useState("65000");
  const [selectedProperty, setSelectedProperty] = useState("2BR Apartment, Kilimani");

  const openPayModal = () => {
    setPayStep("form");
    setPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    setPayStep("processing");
    setTimeout(() => {
      setPayStep(Math.random() > 0.15 ? "success" : "failed");
    }, 3000);
  };

  const openReceipt = (txn: typeof paymentHistory[0]) => {
    setSelectedTxn(txn);
    setReceiptModalOpen(true);
  };

  const totalPaid = paymentHistory.filter(p => p.status === "completed").reduce((sum) => sum + 65000, 0);
  const pendingAmount = upcomingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
            <p className="text-muted-foreground font-body text-sm">Manage your rent payments via M-Pesa</p>
          </div>
          <Button className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))] font-body gap-2" onClick={openPayModal}>
            <Smartphone className="h-4 w-4" />
            Pay with M-Pesa
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Paid", value: `KES ${totalPaid.toLocaleString()}`, icon: TrendingUp, iconColor: "text-[hsl(var(--success))]" },
            { label: "Next Due", value: `KES ${pendingAmount.toLocaleString()}`, icon: Clock, iconColor: "text-secondary" },
            { label: "Payments Made", value: paymentHistory.filter(p => p.status === "completed").length.toString(), icon: CheckCircle2, iconColor: "text-[hsl(var(--info))]" },
            { label: "Due in 8 Days", value: "Apr 01", icon: AlertTriangle, iconColor: "text-[hsl(var(--warning))]" },
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

        {/* Upcoming Payment Alert */}
        {upcomingPayments.map((payment, i) => (
          <Card key={i} className="border-secondary/30 bg-secondary/5">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-body font-semibold text-foreground">{payment.property}</p>
                  <p className="text-sm text-muted-foreground font-body">Due {payment.dueDate} · {payment.daysLeft} days left</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-heading text-secondary">KES {payment.amount.toLocaleString()}</span>
                <Button size="sm" className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))] font-body" onClick={openPayModal}>
                  Pay Now <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Payment History */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Payment History</h2>
            <TabsList>
              <TabsTrigger value="all" className="font-body text-sm">All</TabsTrigger>
              <TabsTrigger value="completed" className="font-body text-sm">Completed</TabsTrigger>
              <TabsTrigger value="failed" className="font-body text-sm">Failed</TabsTrigger>
            </TabsList>
          </div>

          {(["all", "completed", "failed"] as const).map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-body">Transaction</TableHead>
                        <TableHead className="font-body hidden sm:table-cell">Property</TableHead>
                        <TableHead className="font-body">Amount</TableHead>
                        <TableHead className="font-body hidden md:table-cell">M-Pesa Code</TableHead>
                        <TableHead className="font-body">Status</TableHead>
                        <TableHead className="font-body text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory
                        .filter(p => tab === "all" || p.status === tab)
                        .map((txn) => {
                          const config = statusConfig[txn.status];
                          return (
                            <TableRow key={txn.id}>
                              <TableCell>
                                <div>
                                  <p className="font-body font-medium text-foreground">{txn.id}</p>
                                  <p className="text-xs text-muted-foreground font-body">{txn.date}</p>
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell font-body text-muted-foreground">{txn.property}</TableCell>
                              <TableCell className="font-body font-semibold text-foreground">{txn.amount}</TableCell>
                              <TableCell className="hidden md:table-cell font-body text-muted-foreground font-mono text-xs">{txn.mpesaCode}</TableCell>
                              <TableCell>
                                <Badge variant={config.variant} className="gap-1 font-body">
                                  <config.icon className="h-3 w-3" />
                                  {config.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                {txn.status === "completed" ? (
                                  <Button variant="ghost" size="sm" className="font-body text-secondary" onClick={() => openReceipt(txn)}>
                                    <Receipt className="h-4 w-4 mr-1" /> Receipt
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="sm" className="font-body text-muted-foreground" onClick={openPayModal}>
                                    Retry
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

      {/* M-Pesa Payment Modal */}
      <Dialog open={payModalOpen} onOpenChange={setPayModalOpen}>
        <DialogContent className="sm:max-w-md">
          {payStep === "form" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[hsl(var(--success))]" />
                  Pay with M-Pesa
                </DialogTitle>
                <DialogDescription className="font-body">Enter your M-Pesa details to initiate an STK push</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-body font-medium text-foreground">Property</label>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger className="font-body"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2BR Apartment, Kilimani" className="font-body">2BR Apartment, Kilimani</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-body font-medium text-foreground">M-Pesa Phone Number</label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0712345678" className="font-body" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-body font-medium text-foreground">Amount (KES)</label>
                  <Input value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} type="number" className="font-body text-lg font-bold" />
                </div>
                <Card className="bg-muted/50 border-border">
                  <CardContent className="p-3 text-xs text-muted-foreground font-body space-y-1">
                    <p>• An STK push will be sent to your phone</p>
                    <p>• Enter your M-Pesa PIN to confirm</p>
                    <p>• You'll receive an SMS confirmation from Safaricom</p>
                  </CardContent>
                </Card>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayModalOpen(false)} className="font-body">Cancel</Button>
                <Button className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))] font-body" onClick={() => setPayStep("confirm")}>
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {payStep === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading">Confirm Payment</DialogTitle>
                <DialogDescription className="font-body">Review and confirm your payment details</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                {[
                  { label: "Property", value: selectedProperty },
                  { label: "Phone", value: phoneNumber },
                  { label: "Amount", value: `KES ${Number(paymentAmount).toLocaleString()}` },
                  { label: "Method", value: "M-Pesa STK Push" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground font-body">{row.label}</span>
                    <span className="text-sm font-semibold font-body text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPayStep("form")} className="font-body">Back</Button>
                <Button className="bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))] font-body" onClick={handleConfirmPayment}>
                  Send STK Push
                </Button>
              </DialogFooter>
            </>
          )}

          {payStep === "processing" && (
            <div className="py-12 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center animate-pulse">
                <Loader2 className="h-8 w-8 text-[hsl(var(--success))] animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="font-heading font-semibold text-lg text-foreground">STK Push Sent</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">Check your phone ({phoneNumber}) and enter your M-Pesa PIN</p>
              </div>
              <p className="text-xs text-muted-foreground font-body">Waiting for confirmation...</p>
            </div>
          )}

          {payStep === "success" && (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-[hsl(var(--success))]/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-[hsl(var(--success))]" />
              </div>
              <div className="text-center">
                <h3 className="font-heading font-semibold text-lg text-foreground">Payment Successful!</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">KES {Number(paymentAmount).toLocaleString()} paid via M-Pesa</p>
                <p className="text-xs text-muted-foreground font-body font-mono mt-2">M-Pesa Code: SHL4K7X9QR</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="font-body gap-1" onClick={() => setPayModalOpen(false)}>
                  <FileText className="h-4 w-4" /> View Receipt
                </Button>
                <Button className="font-body" onClick={() => setPayModalOpen(false)}>Done</Button>
              </div>
            </div>
          )}

          {payStep === "failed" && (
            <div className="py-10 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="font-heading font-semibold text-lg text-foreground">Payment Failed</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">The transaction was not completed. Please try again.</p>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" className="font-body" onClick={() => setPayModalOpen(false)}>Cancel</Button>
                <Button className="font-body" onClick={() => setPayStep("form")}>Try Again</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Receipt className="h-5 w-5 text-secondary" />
              Payment Receipt
            </DialogTitle>
          </DialogHeader>
          {selectedTxn && (
            <div className="space-y-4">
              <div className="text-center py-4 border-b border-border border-dashed">
                <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center mx-auto mb-2">
                  <Home className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="font-heading font-bold text-foreground">Dwelly Homes</p>
                <p className="text-xs text-muted-foreground font-body">Rent Payment Receipt</p>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Transaction ID", value: selectedTxn.id },
                  { label: "Date", value: selectedTxn.date },
                  { label: "Property", value: selectedTxn.property },
                  { label: "Amount", value: selectedTxn.amount },
                  { label: "Payment Method", value: selectedTxn.method },
                  { label: "M-Pesa Code", value: selectedTxn.mpesaCode },
                  { label: "Status", value: "Completed" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground font-body">{row.label}</span>
                    <span className="text-sm font-medium font-body text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border border-dashed pt-3 text-center">
                <p className="text-xs text-muted-foreground font-body">Thank you for your payment</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="font-body gap-1">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <Button className="font-body" onClick={() => setReceiptModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
