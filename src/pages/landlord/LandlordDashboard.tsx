import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Building2,
  Users,
  Bell,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Settings,
  Plus,
  ChevronRight,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  MessageSquare,
  FileText,
} from "lucide-react";

const rentData = [
  { tenant: "Alice Wanjiku", property: "Sunset Apartments – Unit 4A", amount: 45000, status: "paid", date: "Mar 1, 2026" },
  { tenant: "Brian Ochieng", property: "Sunset Apartments – Unit 2B", amount: 45000, status: "paid", date: "Mar 2, 2026" },
  { tenant: "Catherine Mwende", property: "Karen Heights – Unit 1", amount: 85000, status: "pending", date: "Due Mar 5" },
  { tenant: "David Kamau", property: "Sunset Apartments – Unit 3C", amount: 45000, status: "overdue", date: "Overdue 5 days" },
  { tenant: "Esther Njeri", property: "Karen Heights – Unit 3", amount: 85000, status: "paid", date: "Mar 1, 2026" },
];

const propertyPerformance = [
  { name: "Sunset Apartments", location: "Kilimani", units: 24, occupied: 22, revenue: 990000, trend: "up" },
  { name: "Karen Heights", location: "Karen", units: 8, occupied: 7, revenue: 595000, trend: "up" },
  { name: "Westlands Plaza", location: "Westlands", units: 16, occupied: 12, revenue: 480000, trend: "down" },
];

const recentInquiries = [
  { from: "James Mwangi", property: "Sunset Apartments", message: "Interested in 2BR unit", time: "1h ago" },
  { from: "Faith Akinyi", property: "Karen Heights", message: "Can I schedule a viewing?", time: "3h ago" },
  { from: "Peter Otieno", property: "Westlands Plaza", message: "Is the studio still available?", time: "5h ago" },
];

const statusColor: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
};

const statusIcon: Record<string, React.ElementType> = {
  paid: CheckCircle2,
  pending: Clock,
  overdue: AlertTriangle,
};

export default function LandlordDashboard() {
  const totalExpected = 305000;
  const totalCollected = 175000;
  const collectionRate = (totalCollected / totalExpected) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground">Dwelly Homes</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/landlord" className="px-3 py-2 rounded-md text-sm font-body font-medium bg-secondary/10 text-secondary">Dashboard</Link>
            <Link to="/dashboard/properties" className="px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:text-foreground transition-colors">Properties</Link>
            <Link to="/landlord" className="px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:text-foreground transition-colors">Tenants</Link>
            <Link to="/landlord" className="px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:text-foreground transition-colors">Finances</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">5</span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-body font-bold text-sm">MP</div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Landlord Dashboard</h1>
            <p className="text-muted-foreground font-body mt-1">March 2026 Overview</p>
          </div>
          <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-body" asChild>
            <Link to="/dashboard/properties/new"><Plus className="h-4 w-4 mr-2" /> Add Property</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: "KES 2.07M", sub: "+12% vs last month", icon: DollarSign, iconColor: "text-success", trend: "up" },
            { label: "Properties", value: "3", sub: "48 total units", icon: Building2, iconColor: "text-primary", trend: null },
            { label: "Occupancy Rate", value: "85%", sub: "41 of 48 units", icon: TrendingUp, iconColor: "text-secondary", trend: "up" },
            { label: "Active Tenants", value: "41", sub: "2 pending move-in", icon: Users, iconColor: "text-info", trend: null },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                  {stat.trend === "up" && <ArrowUpRight className="h-4 w-4 text-success" />}
                  {stat.trend === "down" && <ArrowDownRight className="h-4 w-4 text-destructive" />}
                </div>
                <p className="text-2xl font-bold font-heading text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Rent Collection */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg">Rent Collection — March 2026</CardTitle>
              <Badge variant="outline" className="font-body text-xs">
                {Math.round(collectionRate)}% collected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Progress value={collectionRate} className="h-3 [&>div]:bg-success" />
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold font-body text-foreground">KES {totalCollected.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground font-body">of KES {totalExpected.toLocaleString()}</p>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-body font-medium text-muted-foreground">Tenant</th>
                    <th className="text-left p-3 font-body font-medium text-muted-foreground hidden sm:table-cell">Property</th>
                    <th className="text-right p-3 font-body font-medium text-muted-foreground">Amount</th>
                    <th className="text-center p-3 font-body font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rentData.map((row, i) => {
                    const StatusIcon = statusIcon[row.status];
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-3 font-body text-foreground">{row.tenant}</td>
                        <td className="p-3 font-body text-muted-foreground hidden sm:table-cell text-xs">{row.property}</td>
                        <td className="p-3 font-body text-foreground text-right font-medium">KES {row.amount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-body font-medium px-2 py-1 rounded-full ${statusColor[row.status]}`}>
                            <StatusIcon className="h-3 w-3" />
                            {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Property Performance */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Property Performance</h2>
              <Button variant="ghost" size="sm" className="font-body text-secondary">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {propertyPerformance.map((prop) => (
                <Card key={prop.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-body font-semibold text-foreground text-sm">{prop.name}</p>
                          <p className="text-xs text-muted-foreground font-body flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {prop.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="hidden sm:block">
                          <p className="text-xs text-muted-foreground font-body">Occupancy</p>
                          <p className="text-sm font-bold font-body text-foreground">{prop.occupied}/{prop.units}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-body">Revenue</p>
                          <p className="text-sm font-bold font-body text-secondary flex items-center gap-1">
                            KES {(prop.revenue / 1000).toFixed(0)}K
                            {prop.trend === "up" ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Progress value={(prop.occupied / prop.units) * 100} className="h-1.5 [&>div]:bg-secondary" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Inquiries & Quick Actions */}
          <div className="space-y-4">
            <h2 className="font-heading text-lg font-semibold text-foreground">Recent Inquiries</h2>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {recentInquiries.map((inq, i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="h-4 w-4 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-body font-medium text-foreground">{inq.from}</p>
                      <p className="text-xs text-muted-foreground font-body truncate">{inq.message}</p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">{inq.property} · {inq.time}</p>
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
                  <Link to="/dashboard/properties/new"><Plus className="h-4 w-4 mr-2" /> Add New Property</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start font-body" asChild>
                  <Link to="/dashboard/properties"><Building2 className="h-4 w-4 mr-2" /> Manage Listings</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start font-body" asChild>
                  <Link to="/landlord/onboarding"><FileText className="h-4 w-4 mr-2" /> Update Documents</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start font-body" asChild>
                  <Link to="/landlord"><Settings className="h-4 w-4 mr-2" /> Account Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
