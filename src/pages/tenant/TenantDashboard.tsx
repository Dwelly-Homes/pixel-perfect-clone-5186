import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Home,
  Search,
  Heart,
  Bell,
  FileText,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Settings,
  LogOut,
  ChevronRight,
  Star,
  MessageSquare,
  Bed,
  Bath,
} from "lucide-react";

const savedProperties = [
  { id: 1, title: "Modern 2BR Apartment", location: "Kilimani, Nairobi", price: "KES 65,000/mo", beds: 2, baths: 2, image: "/placeholder.svg" },
  { id: 2, title: "Spacious Studio", location: "Westlands, Nairobi", price: "KES 35,000/mo", beds: 1, baths: 1, image: "/placeholder.svg" },
  { id: 3, title: "3BR Garden Villa", location: "Karen, Nairobi", price: "KES 120,000/mo", beds: 3, baths: 3, image: "/placeholder.svg" },
];

const recentActivity = [
  { icon: Eye, text: "Viewed 2BR in Kilimani", time: "2 hours ago", color: "text-info" },
  { icon: MessageSquare, text: "Inquiry sent to Westlands Studio", time: "1 day ago", color: "text-secondary" },
  { icon: Calendar, text: "Viewing scheduled for Karen Villa", time: "2 days ago", color: "text-success" },
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

export default function TenantDashboard() {
  const completedSteps = onboardingChecklist.filter((s) => s.done).length;
  const totalSteps = onboardingChecklist.length;
  const completionPercent = (completedSteps / totalSteps) * 100;

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
            <Link to="/tenant" className="px-3 py-2 rounded-md text-sm font-body font-medium bg-secondary/10 text-secondary">
              Dashboard
            </Link>
            <Link to="/" className="px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Browse
            </Link>
            <Link to="/tenant" className="px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Saved
            </Link>
            <Link to="/tenant" className="px-3 py-2 rounded-md text-sm font-body text-muted-foreground hover:text-foreground transition-colors">
              Messages
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">3</span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-body font-bold text-sm">
              JM
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Welcome back, James 👋</h1>
          <p className="text-muted-foreground font-body mt-1">Here's what's happening with your property search.</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Saved Properties", value: "12", icon: Heart, iconColor: "text-destructive" },
            { label: "Viewings Scheduled", value: "3", icon: Calendar, iconColor: "text-success" },
            { label: "Inquiries Sent", value: "8", icon: MessageSquare, iconColor: "text-secondary" },
            { label: "Profile Views", value: "24", icon: Eye, iconColor: "text-info" },
          ].map((stat) => (
            <Card key={stat.label}>
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
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={item.done ? "text-muted-foreground line-through" : "text-foreground"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Saved Properties */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-foreground">Saved Properties</h2>
              <Button variant="ghost" size="sm" className="font-body text-secondary">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Activity */}
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

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-heading">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start font-body" asChild>
                  <Link to="/"><Search className="h-4 w-4 mr-2" /> Browse Properties</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start font-body" asChild>
                  <Link to="/tenant/onboarding"><FileText className="h-4 w-4 mr-2" /> Update Documents</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start font-body" asChild>
                  <Link to="/tenant"><Settings className="h-4 w-4 mr-2" /> Account Settings</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
