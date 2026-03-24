import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Home,
  Search,
  Heart,
  Bell,
  Calendar,
  Clock,
  Eye,
  Settings,
  LogOut,
  MapPin,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  ArrowLeft,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type BookingStatus = "confirmed" | "pending" | "cancelled" | "completed";
type InquiryStatus = "replied" | "pending" | "closed";

interface Booking {
  id: number;
  property: string;
  location: string;
  date: string;
  timeSlot: string;
  status: BookingStatus;
  agent: string;
  agentPhone: string;
}

interface Inquiry {
  id: number;
  property: string;
  location: string;
  sentAt: string;
  message: string;
  status: InquiryStatus;
  reply?: string;
  agent: string;
}

const bookings: Booking[] = [
  { id: 1, property: "Modern 2BR Apartment", location: "Kilimani, Nairobi", date: "2026-03-28", timeSlot: "Morning (8am–12pm)", status: "confirmed", agent: "James Mwangi", agentPhone: "+254 712 345 678" },
  { id: 2, property: "Spacious Studio", location: "Westlands, Nairobi", date: "2026-03-30", timeSlot: "Afternoon (12pm–5pm)", status: "pending", agent: "Sarah Odhiambo", agentPhone: "+254 723 456 789" },
  { id: 3, property: "3BR Garden Villa", location: "Karen, Nairobi", date: "2026-03-15", timeSlot: "Morning (8am–12pm)", status: "completed", agent: "Peter Kamau", agentPhone: "+254 734 567 890" },
  { id: 4, property: "1BR Cozy Flat", location: "Lavington, Nairobi", date: "2026-03-10", timeSlot: "Evening (5pm–7pm)", status: "cancelled", agent: "Mary Wanjiku", agentPhone: "+254 745 678 901" },
];

const inquiries: Inquiry[] = [
  { id: 1, property: "Modern 2BR Apartment", location: "Kilimani, Nairobi", sentAt: "2026-03-22", message: "Is this property still available? I'd like to move in by April.", status: "replied", reply: "Yes, it's available! Let's schedule a viewing.", agent: "James Mwangi" },
  { id: 2, property: "Luxury Penthouse", location: "Upperhill, Nairobi", sentAt: "2026-03-23", message: "Can you share more details about the parking situation?", status: "pending", agent: "Grace Njeri" },
  { id: 3, property: "2BR Family Home", location: "Runda, Nairobi", sentAt: "2026-03-10", message: "What utilities are included in the rent?", status: "closed", reply: "Water and garbage collection are included. Electricity is separate.", agent: "David Otieno" },
];

const statusConfig: Record<BookingStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle2 },
};

const inquiryStatusConfig: Record<InquiryStatus, { label: string; color: string }> = {
  replied: { label: "Replied", color: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "Awaiting Reply", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border" },
};

const navItems = [
  { icon: Home, label: "Dashboard", href: "/tenant" },
  { icon: Search, label: "Browse", href: "/" },
  { icon: Calendar, label: "Bookings", href: "/tenant/bookings", active: true },
  { icon: Heart, label: "Saved", href: "/tenant" },
  { icon: Bell, label: "Alerts", href: "/tenant" },
];

export default function TenantBookings() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBookings = statusFilter === "all" ? bookings : bookings.filter(b => b.status === statusFilter);
  const filteredInquiries = statusFilter === "all" ? inquiries : inquiries.filter(i => i.status === statusFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/tenant" className="flex items-center gap-2 text-primary font-heading font-bold text-lg">
            <ArrowLeft className="h-4 w-4" /> My Bookings & Inquiries
          </Link>
          <div className="flex items-center gap-2">
            {navItems.map(item => (
              <Link key={item.label} to={item.href}>
                <Button variant={item.active ? "default" : "ghost"} size="sm" className="gap-1.5 font-body text-xs">
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Viewings", value: bookings.length, icon: Eye, color: "text-primary" },
            { label: "Confirmed", value: bookings.filter(b => b.status === "confirmed").length, icon: CheckCircle2, color: "text-green-600" },
            { label: "Pending", value: bookings.filter(b => b.status === "pending").length, icon: Clock, color: "text-yellow-600" },
            { label: "Inquiries Sent", value: inquiries.length, icon: Send, color: "text-secondary" },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-heading font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList>
              <TabsTrigger value="bookings" className="font-body gap-1.5">
                <Calendar className="h-4 w-4" /> Viewing Requests
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="font-body gap-1.5">
                <MessageSquare className="h-4 w-4" /> Inquiries
              </TabsTrigger>
            </TabsList>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] font-body">
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-3">
            {filteredBookings.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground font-body">No viewing requests found.</CardContent></Card>
            )}
            {filteredBookings.map(booking => {
              const config = statusConfig[booking.status];
              const StatusIcon = config.icon;
              return (
                <Card key={booking.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-32 h-24 sm:h-auto bg-muted flex items-center justify-center shrink-0">
                        <Eye className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <div className="flex-1 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-heading font-semibold">{booking.property}</h3>
                            <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" /> {booking.location}
                            </p>
                          </div>
                          <Badge variant="outline" className={`${config.color} gap-1 shrink-0`}>
                            <StatusIcon className="h-3 w-3" /> {config.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm font-body text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(booking.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {booking.timeSlot}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-border">
                          <p className="text-sm font-body">
                            <span className="text-muted-foreground">Agent:</span> <strong>{booking.agent}</strong>
                          </p>
                          {booking.status === "confirmed" && (
                            <a href={`tel:${booking.agentPhone.replace(/\s/g, "")}`} className="text-sm text-secondary hover:underline font-body flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {booking.agentPhone}
                            </a>
                          )}
                          {booking.status === "pending" && (
                            <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10 font-body text-xs">
                              Cancel Request
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries" className="space-y-3">
            {filteredInquiries.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground font-body">No inquiries found.</CardContent></Card>
            )}
            {filteredInquiries.map(inquiry => {
              const config = inquiryStatusConfig[inquiry.status];
              return (
                <Card key={inquiry.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading font-semibold">{inquiry.property}</h3>
                        <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {inquiry.location}
                        </p>
                      </div>
                      <Badge variant="outline" className={`${config.color} shrink-0`}>{config.label}</Badge>
                    </div>

                    <div className="bg-muted rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <Send className="h-3 w-3" /> You · {new Date(inquiry.sentAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                      </div>
                      <p className="text-sm font-body">{inquiry.message}</p>
                    </div>

                    {inquiry.reply && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-primary font-body">
                          <MessageSquare className="h-3 w-3" /> {inquiry.agent}
                        </div>
                        <p className="text-sm font-body">{inquiry.reply}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-muted-foreground font-body">Agent: {inquiry.agent}</p>
                      {inquiry.status === "replied" && (
                        <Button size="sm" variant="outline" className="font-body text-xs gap-1">
                          <Send className="h-3 w-3" /> Follow Up
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
