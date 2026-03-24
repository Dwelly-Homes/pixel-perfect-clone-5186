import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  Building2,
  Calendar,
  Clock,
  Eye,
  Settings,
  ArrowLeft,
  MapPin,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Send,
  Filter,
  User,
  Reply,
} from "lucide-react";
import { toast } from "sonner";

type ViewingStatus = "pending" | "confirmed" | "declined" | "completed";
type InquiryStatus = "new" | "replied" | "closed";

interface ViewingRequest {
  id: number;
  property: string;
  location: string;
  tenant: string;
  tenantPhone: string;
  tenantEmail: string;
  date: string;
  timeSlot: string;
  status: ViewingStatus;
  requestedAt: string;
}

interface ReceivedInquiry {
  id: number;
  property: string;
  location: string;
  tenant: string;
  tenantPhone: string;
  tenantEmail: string;
  message: string;
  sentAt: string;
  status: InquiryStatus;
  reply?: string;
}

const viewingRequests: ViewingRequest[] = [
  { id: 1, property: "Kilimani Heights 2BR", location: "Kilimani, Nairobi", tenant: "John Kamau", tenantPhone: "+254 712 111 222", tenantEmail: "john@email.com", date: "2026-03-28", timeSlot: "Morning (8am–12pm)", status: "pending", requestedAt: "2026-03-23" },
  { id: 2, property: "Westlands Studio", location: "Westlands, Nairobi", tenant: "Mary Achieng", tenantPhone: "+254 723 222 333", tenantEmail: "mary@email.com", date: "2026-03-29", timeSlot: "Afternoon (12pm–5pm)", status: "pending", requestedAt: "2026-03-22" },
  { id: 3, property: "Kilimani Heights 2BR", location: "Kilimani, Nairobi", tenant: "David Otieno", tenantPhone: "+254 734 333 444", tenantEmail: "david@email.com", date: "2026-03-26", timeSlot: "Morning (8am–12pm)", status: "confirmed", requestedAt: "2026-03-20" },
  { id: 4, property: "Karen Villa 3BR", location: "Karen, Nairobi", tenant: "Grace Njeri", tenantPhone: "+254 745 444 555", tenantEmail: "grace@email.com", date: "2026-03-15", timeSlot: "Evening (5pm–7pm)", status: "completed", requestedAt: "2026-03-12" },
  { id: 5, property: "Westlands Studio", location: "Westlands, Nairobi", tenant: "Peter Wafula", tenantPhone: "+254 756 555 666", tenantEmail: "peter@email.com", date: "2026-03-14", timeSlot: "Afternoon (12pm–5pm)", status: "declined", requestedAt: "2026-03-11" },
];

const receivedInquiries: ReceivedInquiry[] = [
  { id: 1, property: "Kilimani Heights 2BR", location: "Kilimani, Nairobi", tenant: "Alice Muthoni", tenantPhone: "+254 712 666 777", tenantEmail: "alice@email.com", message: "Is this property still available? I can move in immediately.", sentAt: "2026-03-23", status: "new" },
  { id: 2, property: "Karen Villa 3BR", location: "Karen, Nairobi", tenant: "Brian Kiprop", tenantPhone: "+254 723 777 888", tenantEmail: "brian@email.com", message: "Are pets allowed? I have a small dog.", sentAt: "2026-03-22", status: "new" },
  { id: 3, property: "Westlands Studio", location: "Westlands, Nairobi", tenant: "Cynthia Auma", tenantPhone: "+254 734 888 999", tenantEmail: "cynthia@email.com", message: "What's included in the rent? Water, electricity?", sentAt: "2026-03-20", status: "replied", reply: "Water and garbage are included. Electricity is paid separately via prepaid meter." },
  { id: 4, property: "Kilimani Heights 2BR", location: "Kilimani, Nairobi", tenant: "Dennis Njuguna", tenantPhone: "+254 745 999 000", tenantEmail: "dennis@email.com", message: "Can I negotiate the rent if I pay 6 months upfront?", sentAt: "2026-03-15", status: "closed", reply: "We can offer a 5% discount for 6-month upfront payment." },
];

const viewingStatusConfig: Record<ViewingStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  declined: { label: "Declined", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground border-border", icon: CheckCircle2 },
};

const inquiryStatusConfig: Record<InquiryStatus, { label: string; color: string }> = {
  new: { label: "New", color: "bg-secondary/20 text-secondary border-secondary/30" },
  replied: { label: "Replied", color: "bg-green-100 text-green-700 border-green-200" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border" },
};

export default function LandlordInquiries() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");

  const pendingViewings = viewingRequests.filter(v => v.status === "pending").length;
  const newInquiries = receivedInquiries.filter(i => i.status === "new").length;

  const filteredViewings = statusFilter === "all" ? viewingRequests : viewingRequests.filter(v => v.status === statusFilter);
  const filteredInquiries = statusFilter === "all" ? receivedInquiries : receivedInquiries.filter(i => i.status === statusFilter);

  const handleConfirm = (id: number) => toast.success(`Viewing #${id} confirmed! Tenant has been notified.`);
  const handleDecline = (id: number) => toast.info(`Viewing #${id} declined.`);
  const handleReply = (id: number) => {
    if (!replyText.trim()) return;
    toast.success(`Reply sent to inquiry #${id}`);
    setReplyingTo(null);
    setReplyText("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
          <Link to="/landlord" className="flex items-center gap-2 text-primary font-heading font-bold text-lg">
            <ArrowLeft className="h-4 w-4" /> Inquiries & Viewings
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/landlord"><Button variant="ghost" size="sm" className="gap-1.5 font-body text-xs"><Home className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span></Button></Link>
            <Link to="/landlord/inquiries"><Button variant="default" size="sm" className="gap-1.5 font-body text-xs"><MessageSquare className="h-4 w-4" /><span className="hidden sm:inline">Inquiries</span></Button></Link>
            <Link to="/dashboard/properties"><Button variant="ghost" size="sm" className="gap-1.5 font-body text-xs"><Building2 className="h-4 w-4" /><span className="hidden sm:inline">Properties</span></Button></Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Pending Viewings", value: pendingViewings, icon: Clock, color: "text-yellow-600" },
            { label: "New Inquiries", value: newInquiries, icon: AlertCircle, color: "text-secondary" },
            { label: "Total Viewings", value: viewingRequests.length, icon: Eye, color: "text-primary" },
            { label: "Total Inquiries", value: receivedInquiries.length, icon: MessageSquare, color: "text-primary" },
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

        <Tabs defaultValue="viewings" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TabsList>
              <TabsTrigger value="viewings" className="font-body gap-1.5">
                <Calendar className="h-4 w-4" /> Viewing Requests
                {pendingViewings > 0 && <span className="ml-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-bold">{pendingViewings}</span>}
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="font-body gap-1.5">
                <MessageSquare className="h-4 w-4" /> Inquiries
                {newInquiries > 0 && <span className="ml-1 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-bold">{newInquiries}</span>}
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
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Viewings Tab */}
          <TabsContent value="viewings" className="space-y-3">
            {filteredViewings.length === 0 && (
              <Card><CardContent className="p-8 text-center text-muted-foreground font-body">No viewing requests found.</CardContent></Card>
            )}
            {filteredViewings.map(viewing => {
              const config = viewingStatusConfig[viewing.status];
              const StatusIcon = config.icon;
              return (
                <Card key={viewing.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading font-semibold">{viewing.property}</h3>
                        <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {viewing.location}
                        </p>
                      </div>
                      <Badge variant="outline" className={`${config.color} gap-1 shrink-0`}>
                        <StatusIcon className="h-3 w-3" /> {config.label}
                      </Badge>
                    </div>

                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-body font-medium text-sm">{viewing.tenant}</span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm font-body text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {viewing.tenantPhone}</span>
                        <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {viewing.tenantEmail}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm font-body text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {new Date(viewing.date).toLocaleDateString("en-KE", { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {viewing.timeSlot}</span>
                      <span className="text-xs">Requested {new Date(viewing.requestedAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</span>
                    </div>

                    {viewing.status === "pending" && (
                      <div className="flex gap-2 pt-1 border-t border-border">
                        <Button size="sm" className="font-body text-xs gap-1" onClick={() => handleConfirm(viewing.id)}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                        </Button>
                        <Button size="sm" variant="outline" className="font-body text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDecline(viewing.id)}>
                          <XCircle className="h-3.5 w-3.5" /> Decline
                        </Button>
                        <a href={`tel:${viewing.tenantPhone.replace(/\s/g, "")}`}>
                          <Button size="sm" variant="ghost" className="font-body text-xs gap-1">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </Button>
                        </a>
                      </div>
                    )}
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

                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span className="font-body font-medium text-sm">{inquiry.tenant}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-body">{new Date(inquiry.sentAt).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}</span>
                      </div>
                      <p className="text-sm font-body">{inquiry.message}</p>
                      <div className="flex gap-3 mt-2 text-xs font-body text-muted-foreground">
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {inquiry.tenantPhone}</span>
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {inquiry.tenantEmail}</span>
                      </div>
                    </div>

                    {inquiry.reply && (
                      <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-primary font-body mb-1">
                          <Reply className="h-3 w-3" /> Your reply
                        </div>
                        <p className="text-sm font-body">{inquiry.reply}</p>
                      </div>
                    )}

                    {inquiry.status === "new" && replyingTo !== inquiry.id && (
                      <div className="flex gap-2 pt-1 border-t border-border">
                        <Button size="sm" className="font-body text-xs gap-1" onClick={() => setReplyingTo(inquiry.id)}>
                          <Reply className="h-3.5 w-3.5" /> Reply
                        </Button>
                        <a href={`tel:${inquiry.tenantPhone.replace(/\s/g, "")}`}>
                          <Button size="sm" variant="ghost" className="font-body text-xs gap-1">
                            <Phone className="h-3.5 w-3.5" /> Call
                          </Button>
                        </a>
                      </div>
                    )}

                    {replyingTo === inquiry.id && (
                      <div className="space-y-2 pt-1 border-t border-border">
                        <Textarea
                          placeholder="Type your reply..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          rows={3}
                          className="font-body"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="font-body text-xs gap-1" onClick={() => handleReply(inquiry.id)}>
                            <Send className="h-3.5 w-3.5" /> Send Reply
                          </Button>
                          <Button size="sm" variant="ghost" className="font-body text-xs" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
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
