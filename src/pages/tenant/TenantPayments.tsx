import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard, Search, MessageSquare, MapPin, Home,
  Calendar, Phone, Mail, User, TrendingUp, Clock, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface LeaseProperty {
  _id: string;
  title: string;
  neighborhood: string;
  county: string;
  streetEstate?: string;
  propertyType: string;
  images: { url: string; isCover?: boolean }[];
}

interface LeaseAgent {
  fullName: string;
  phone?: string;
  email?: string;
}

interface Lease {
  _id: string;
  occupantName: string;
  monthlyRent: number;
  depositAmount: number;
  leaseStart: string;
  leaseEnd: string | null;
  status: "active" | "expired" | "terminated";
  notes: string | null;
  propertyId: LeaseProperty;
  agentId: LeaseAgent;
}

const TYPE_LABEL: Record<string, string> = {
  bedsitter: "Bedsitter", studio: "Studio", "1_bedroom": "1 Bedroom",
  "2_bedroom": "2 Bedroom", "3_bedroom": "3 Bedroom",
  "4_plus_bedroom": "4+ Bedroom", maisonette: "Maisonette",
  bungalow: "Bungalow", townhouse: "Townhouse",
};

export default function TenantPayments() {
  const { data: lease, isLoading } = useQuery<Lease | null>({
    queryKey: ["myLease"],
    queryFn: async () => {
      const { data } = await api.get("/leases/my");
      return data?.data as Lease | null;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground font-body text-sm">Track your rent payments and payment history.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!lease) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground font-body text-sm">Track your rent payments and payment history.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Total Paid",    value: "KES 0", icon: TrendingUp,   iconColor: "text-green-600" },
            { label: "Next Due",      value: "—",      icon: Clock,        iconColor: "text-secondary" },
            { label: "Payments Made", value: "0",      icon: CheckCircle2, iconColor: "text-blue-500" },
            { label: "Upcoming",      value: "None",   icon: AlertTriangle,iconColor: "text-amber-500" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-bold font-heading truncate">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-body leading-tight">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-blue-200 bg-blue-50/40">
          <CardContent className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
              <Home className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-sm">Rent payments are handled directly with your landlord or agent</p>
              <p className="text-sm text-muted-foreground font-body">
                Once you move into a property sourced through Dwelly, your rent payment
                history will appear here. Payment tracking is activated when your agent records your move-in date.
              </p>
            </div>
          </CardContent>
        </Card>

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
                Your payment history will appear here once you are in an active tenancy tracked on Dwelly.
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

  // ── Active lease view ──────────────────────────────────────────────────────
  const property = lease.propertyId;
  const agent = lease.agentId;
  const coverImage = property.images?.find((i) => i.isCover)?.url || property.images?.[0]?.url;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground font-body text-sm">Your active tenancy and payment details.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, color: "text-green-600", value: `KES ${lease.monthlyRent.toLocaleString()}`, label: "Monthly Rent" },
          { icon: Clock, color: "text-secondary", value: format(new Date(lease.leaseStart), "d MMM yyyy"), label: "Lease Start" },
          { icon: CheckCircle2, color: "text-blue-500", value: `KES ${lease.depositAmount.toLocaleString()}`, label: "Deposit Paid" },
          { icon: Calendar, color: "text-amber-500", value: lease.leaseEnd ? format(new Date(lease.leaseEnd), "d MMM yyyy") : "Open-ended", label: "Lease End" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <s.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${s.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold font-heading truncate">{s.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-body leading-tight">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Property card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading">Your Property</CardTitle>
            <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active Tenancy</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {coverImage && (
              <div className="w-full sm:w-40 h-32 sm:h-auto shrink-0 overflow-hidden">
                <img src={coverImage} alt={property.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-4 space-y-2 flex-1">
              <div>
                <p className="font-semibold font-heading">{property.title}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[property.streetEstate, property.neighborhood, property.county].filter(Boolean).join(", ")}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {TYPE_LABEL[property.propertyType] ?? property.propertyType}
              </Badge>
              {lease.notes && (
                <p className="text-xs text-muted-foreground bg-muted/40 rounded p-2">{lease.notes}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Your Agent</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm shrink-0">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-sm">{agent.fullName}</p>
              {agent.phone && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> {agent.phone}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            {agent.phone && (
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
                <a href={`tel:${agent.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" />Call</a>
              </Button>
            )}
            {agent.email && (
              <Button size="sm" variant="outline" className="flex-1 sm:flex-none" asChild>
                <a href={`mailto:${agent.email}`}><Mail className="h-3.5 w-3.5 mr-1.5" />Email</a>
              </Button>
            )}
            <Button size="sm" className="bg-secondary hover:bg-secondary/90 flex-1 sm:flex-none" asChild>
              <Link to="/tenant/messages"><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Message</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment history placeholder */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center text-center gap-3">
          <CreditCard className="h-10 w-10 text-muted-foreground opacity-30" />
          <div>
            <p className="font-medium text-sm">M-Pesa payment integration coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              Your rent payment records will appear here once M-Pesa direct payment is enabled.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
