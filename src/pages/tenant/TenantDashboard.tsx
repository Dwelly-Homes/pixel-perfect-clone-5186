import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Home, Search, Heart, FileText, MapPin, Calendar, CheckCircle2,
  Clock, Eye, Settings, ChevronRight, Star, MessageSquare, Bed,
  Bath, Phone, Mail, CreditCard, AlertTriangle, Building2, User,
} from "lucide-react";

const savedProperties = [
  { id: 1, title: "Modern 2BR Apartment", location: "Kilimani, Nairobi", price: "KES 65,000/mo", beds: 2, baths: 2, image: "/placeholder.svg" },
  { id: 2, title: "Spacious Studio", location: "Westlands, Nairobi", price: "KES 35,000/mo", beds: 1, baths: 1, image: "/placeholder.svg" },
  { id: 3, title: "3BR Garden Villa", location: "Karen, Nairobi", price: "KES 120,000/mo", beds: 3, baths: 3, image: "/placeholder.svg" },
];

const recentActivity = [
  { icon: Eye, text: "Viewed 2BR in Kilimani", time: "2 hours ago", color: "text-blue-500" },
  { icon: MessageSquare, text: "Inquiry sent to Westlands Studio", time: "1 day ago", color: "text-secondary" },
  { icon: Calendar, text: "Viewing scheduled for Karen Villa", time: "2 days ago", color: "text-green-600" },
  { icon: Heart, text: "Saved 3BR in Lavington", time: "3 days ago", color: "text-destructive" },
];

const onboardingChecklist = [
  { label: "Profile completed", done: true },
  { label: "Preferences set", done: true },
  { label: "ID uploaded", done: true },
  { label: "Payslip uploaded", done: true },
  { label: "Email verified", done: false },
  { label: "Phone verified", done: false },
];

const CURRENT_TENANCY = {
  property: "2BR Apartment, Kilimani",
  address: "Eden Square, Chiromo Rd, Kilimani, Nairobi",
  monthlyRent: 65000,
  leaseStart: "2024-01-01",
  leaseEnd: "2024-12-31",
  agent: "James Mwangi",
  agentPhone: "+254 712 345 678",
  agentEmail: "j.mwangi@prestige.co.ke",
  agency: "Prestige Properties Ltd",
  nextPaymentDate: "2024-07-01",
  nextPaymentAmount: 65000,
  daysUntilPayment: 10,
};

const UPCOMING_VIEWING = {
  property: "Modern 2BR Apartment",
  location: "Kilimani, Nairobi",
  date: "2026-03-28",
  time: "Morning (8am–12pm)",
  agent: "James Mwangi",
  status: "confirmed",
};

export default function TenantDashboard() {
  const completedSteps = onboardingChecklist.filter((s) => s.done).length;
  const totalSteps = onboardingChecklist.length;
  const completionPercent = (completedSteps / totalSteps) * 100;

  const leaseProgressDays = Math.ceil(
    (new Date(CURRENT_TENANCY.leaseEnd).getTime() - new Date(CURRENT_TENANCY.leaseStart).getTime()) / 86400000
  );
  const daysElapsed = Math.ceil(
    (Date.now() - new Date(CURRENT_TENANCY.leaseStart).getTime()) / 86400000
  );
  const leaseProgressPct = Math.min(100, Math.round((daysElapsed / leaseProgressDays) * 100));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, James 👋</h1>
        <p className="text-muted-foreground font-body mt-1">Here's what's happening with your property search and tenancy.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Saved Properties", value: "12", icon: Heart, iconColor: "text-destructive", href: "/tenant/saved" },
          { label: "Viewings Scheduled", value: "3", icon: Calendar, iconColor: "text-green-600", href: "/tenant/bookings" },
          { label: "Inquiries Sent", value: "8", icon: MessageSquare, iconColor: "text-secondary", href: "/tenant/bookings" },
          { label: "Unread Messages", value: "2", icon: MessageSquare, iconColor: "text-blue-500", href: "/tenant/messages" },
        ].map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold font-heading text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Onboarding Progress */}
      {completionPercent < 100 && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-heading font-semibold text-foreground">Complete Your Profile</h3>
                <p className="text-xs text-muted-foreground font-body">{completedSteps} of {totalSteps} steps done</p>
              </div>
              <span className="text-lg font-bold font-heading text-secondary">{Math.round(completionPercent)}%</span>
            </div>
            <Progress value={completionPercent} className="h-2 mb-4 [&>div]:bg-secondary" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {onboardingChecklist.map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm font-body">
                  {item.done
                    ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <Button asChild size="sm" className="mt-4 bg-secondary hover:bg-secondary/90">
              <Link to="/tenant/onboarding">Continue Setup</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Current Tenancy */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />Current Tenancy
            </CardTitle>
            <Badge className="bg-green-100 text-green-700 border-0">Active Lease</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-muted-foreground font-body">Property</p>
                <p className="font-semibold font-heading">{CURRENT_TENANCY.property}</p>
                <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />{CURRENT_TENANCY.address}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground font-body">Lease Start</p>
                  <p className="font-medium">{new Date(CURRENT_TENANCY.leaseStart).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-body">Lease End</p>
                  <p className="font-medium">{new Date(CURRENT_TENANCY.leaseEnd).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Lease progress</span>
                  <span className="font-medium">{leaseProgressPct}% complete</span>
                </div>
                <Progress value={leaseProgressPct} className="h-1.5" />
              </div>
            </div>
            <div className="space-y-2.5">
              <div>
                <p className="text-xs text-muted-foreground font-body">Monthly Rent</p>
                <p className="text-2xl font-heading font-bold text-secondary">KES {CURRENT_TENANCY.monthlyRent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-body mb-1.5">Agent / Property Manager</p>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">JM</div>
                  <div>
                    <p className="text-sm font-medium font-body">{CURRENT_TENANCY.agent}</p>
                    <p className="text-[10px] text-muted-foreground">{CURRENT_TENANCY.agency}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                  <a href={`tel:${CURRENT_TENANCY.agentPhone}`}><Phone className="h-3.5 w-3.5" />Call</a>
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                  <a href={`mailto:${CURRENT_TENANCY.agentEmail}`}><Mail className="h-3.5 w-3.5" />Email</a>
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs" asChild>
                  <Link to="/tenant/messages"><MessageSquare className="h-3.5 w-3.5" />Message</Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Payment + Viewing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Payment */}
        <Card className={CURRENT_TENANCY.daysUntilPayment <= 7 ? "border-amber-300 bg-amber-50/50" : "border-secondary/20 bg-secondary/5"}>
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${CURRENT_TENANCY.daysUntilPayment <= 7 ? "bg-amber-100" : "bg-secondary/20"}`}>
                {CURRENT_TENANCY.daysUntilPayment <= 7
                  ? <AlertTriangle className="h-5 w-5 text-amber-600" />
                  : <CreditCard className="h-5 w-5 text-secondary" />
                }
              </div>
              <div>
                <p className="font-body font-semibold text-sm text-foreground">Next Rent Payment</p>
                <p className="text-xs text-muted-foreground font-body">
                  Due {new Date(CURRENT_TENANCY.nextPaymentDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })} · {CURRENT_TENANCY.daysUntilPayment} days left
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-heading font-bold text-secondary">KES {CURRENT_TENANCY.nextPaymentAmount.toLocaleString()}</p>
              <Button size="sm" className="mt-1 bg-green-600 hover:bg-green-700 text-white text-xs" asChild>
                <Link to="/tenant/payments">Pay Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Next Viewing */}
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-body font-semibold text-sm text-foreground">Upcoming Viewing</p>
                <p className="text-xs text-muted-foreground font-body">{UPCOMING_VIEWING.property}</p>
                <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(UPCOMING_VIEWING.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })} · {UPCOMING_VIEWING.time}
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="text-xs shrink-0" asChild>
              <Link to="/tenant/bookings">View All</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Saved Properties */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Saved Properties</h2>
            <Button variant="ghost" size="sm" className="font-body text-secondary" asChild>
              <Link to="/tenant/saved">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {savedProperties.map((property) => (
              <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-muted relative">
                  <img src={property.image} alt={property.title} className="h-full w-full object-cover" />
                  <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 bg-card/80 hover:bg-card">
                    <Heart className="h-3.5 w-3.5 text-destructive fill-destructive" />
                  </Button>
                </div>
                <CardContent className="p-3">
                  <p className="font-body font-semibold text-sm text-foreground truncate">{property.title}</p>
                  <p className="text-xs text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3 w-3" /> {property.location}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-secondary font-body">{property.price}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                      <span className="flex items-center gap-0.5"><Bed className="h-3 w-3" /> {property.beds}</span>
                      <span className="flex items-center gap-0.5"><Bath className="h-3 w-3" /> {property.baths}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Activity + Quick Actions */}
        <div className="space-y-4">
          <h2 className="font-heading text-lg font-semibold text-foreground">Recent Activity</h2>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-body text-foreground">{item.text}</p>
                    <p className="text-xs text-muted-foreground font-body">{item.time}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/"><Search className="h-4 w-4 mr-2" /> Browse Properties</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/payments"><CreditCard className="h-4 w-4 mr-2" /> Pay Rent</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/messages"><MessageSquare className="h-4 w-4 mr-2" /> Message Agent</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/profile"><Settings className="h-4 w-4 mr-2" /> Account Settings</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/onboarding"><FileText className="h-4 w-4 mr-2" /> Update Documents</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
