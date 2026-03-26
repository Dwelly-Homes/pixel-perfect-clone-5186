import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Eye, Search, Calendar, Clock, CheckCircle2, XCircle,
  Send, MapPin, Phone, MessageSquare, Filter, Loader2,
} from "lucide-react";
import { api, getApiError } from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PopulatedProperty {
  _id: string;
  title: string;
  county?: string;
  neighborhood?: string;
  monthlyRent?: number;
}

interface PopulatedAgent {
  _id: string;
  fullName: string;
  phone?: string;
}

interface Inquiry {
  _id: string;
  inquiryType: "general" | "viewing_request" | "booking_intent";
  status: "new" | "responded" | "closed";
  senderName: string;
  senderPhone: string;
  senderEmail: string;
  message: string;
  requestedDate: string | null;
  requestedTimeSlot: "morning" | "afternoon" | "evening" | null;
  propertyId: PopulatedProperty | null;
  agentId: PopulatedAgent | null;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  new:       { label: "Pending",   color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: Clock },
  responded: { label: "Replied",   color: "bg-green-100 text-green-700 border-green-200",   icon: CheckCircle2 },
  closed:    { label: "Closed",    color: "bg-muted text-muted-foreground border-border",    icon: XCircle },
};

const timeSlotLabel: Record<string, string> = {
  morning:   "Morning (8am – 12pm)",
  afternoon: "Afternoon (12pm – 5pm)",
  evening:   "Evening (5pm – 7pm)",
};

function propertyLocation(p: PopulatedProperty | null) {
  if (!p) return "";
  return [p.neighborhood, p.county].filter(Boolean).join(", ");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TenantBookings() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [startingChatFor, setStartingChatFor] = useState<string | null>(null);

  const startChatMutation = useMutation({
    mutationFn: async ({ recipientId, propertyId }: { recipientId: string; propertyId?: string }) => {
      const { data } = await api.post("/chat", { recipientId, propertyId });
      return data?.data as { _id: string };
    },
    onSuccess: (conv) => {
      navigate(`/tenant/messages?conv=${conv._id}`);
    },
    onError: (err) => {
      toast.error(getApiError(err));
      setStartingChatFor(null);
    },
  });

  function handleMessageAgent(inquiry: Inquiry) {
    if (!inquiry.agentId) return;
    setStartingChatFor(inquiry._id);
    startChatMutation.mutate({
      recipientId: inquiry.agentId._id,
      propertyId: inquiry.propertyId?._id,
    });
  }

  const { data, isLoading } = useQuery({
    queryKey: ["myInquiries"],
    queryFn: async () => {
      const { data } = await api.get("/inquiries/my");
      return data?.data as Inquiry[];
    },
    staleTime: 30000,
  });

  const inquiries = data ?? [];

  const viewings = inquiries.filter((i) =>
    i.inquiryType === "viewing_request" || i.inquiryType === "booking_intent"
  );
  const generalInquiries = inquiries.filter((i) => i.inquiryType === "general");

  function applyFilter(list: Inquiry[]) {
    if (statusFilter === "all") return list;
    return list.filter((i) => i.status === statusFilter);
  }

  const filteredViewings  = applyFilter(viewings);
  const filteredInquiries = applyFilter(generalInquiries);

  const stats = [
    { label: "Total Viewings",  value: viewings.length,                                    icon: Eye,          color: "text-primary" },
    { label: "Confirmed",       value: viewings.filter((b) => b.status === "responded").length, icon: CheckCircle2, color: "text-green-600" },
    { label: "Pending",         value: viewings.filter((b) => b.status === "new").length,      icon: Clock,        color: "text-yellow-600" },
    { label: "Inquiries Sent",  value: generalInquiries.length,                            icon: Send,         color: "text-secondary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Bookings & Inquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">Your viewing requests and property inquiries.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-7 w-8 mb-0.5" />
                ) : (
                  <p className="text-2xl font-heading font-bold">{stat.value}</p>
                )}
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
              <SelectItem value="new">Pending</SelectItem>
              <SelectItem value="responded">Replied</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Viewings Tab */}
        <TabsContent value="viewings" className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
          ) : filteredViewings.length === 0 ? (
            <Card>
              <CardContent className="p-8 flex flex-col items-center text-center gap-3">
                <Calendar className="h-10 w-10 text-muted-foreground opacity-30" />
                <div>
                  <p className="font-medium text-sm">No viewing requests yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Browse properties and request a viewing directly from the listing.
                  </p>
                </div>
                <Button size="sm" asChild className="bg-secondary hover:bg-secondary/90">
                  <Link to="/"><Search className="h-4 w-4 mr-2" />Browse Properties</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredViewings.map((booking) => {
              const config = statusConfig[booking.status];
              const StatusIcon = config.icon;
              const property = booking.propertyId;
              const agent = booking.agentId;
              return (
                <Card key={booking._id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-32 h-24 sm:h-auto bg-muted flex items-center justify-center shrink-0">
                        <Eye className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <div className="flex-1 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-heading font-semibold">{property?.title ?? "Property"}</h3>
                            {property && (
                              <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> {propertyLocation(property)}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className={`${config.color} gap-1 shrink-0`}>
                            <StatusIcon className="h-3 w-3" /> {config.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm font-body text-muted-foreground">
                          {booking.requestedDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(booking.requestedDate), "EEE, MMM d, yyyy")}
                            </span>
                          )}
                          {booking.requestedTimeSlot && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {timeSlotLabel[booking.requestedTimeSlot]}
                            </span>
                          )}
                          <span className="flex items-center gap-1 ml-auto text-[10px]">
                            Submitted {formatDistanceToNow(new Date(booking.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {agent && (
                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border flex-wrap">
                            <p className="text-sm font-body">
                              <span className="text-muted-foreground">Agent:</span> <strong>{agent.fullName}</strong>
                            </p>
                            <div className="flex items-center gap-2">
                              {booking.status === "responded" && agent.phone && (
                                <a
                                  href={`tel:${agent.phone}`}
                                  className="text-sm text-secondary hover:underline font-body flex items-center gap-1"
                                >
                                  <Phone className="h-3.5 w-3.5" /> {agent.phone}
                                </a>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="font-body text-xs gap-1"
                                disabled={startingChatFor === booking._id}
                                onClick={() => handleMessageAgent(booking)}
                              >
                                {startingChatFor === booking._id
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <MessageSquare className="h-3 w-3" />
                                }
                                Message Agent
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Inquiries Tab */}
        <TabsContent value="inquiries" className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
          ) : filteredInquiries.length === 0 ? (
            <Card>
              <CardContent className="p-8 flex flex-col items-center text-center gap-3">
                <MessageSquare className="h-10 w-10 text-muted-foreground opacity-30" />
                <div>
                  <p className="font-medium text-sm">No inquiries yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the contact form on a property listing to send an inquiry.
                  </p>
                </div>
                <Button size="sm" asChild className="bg-secondary hover:bg-secondary/90">
                  <Link to="/"><Search className="h-4 w-4 mr-2" />Browse Properties</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredInquiries.map((inquiry) => {
              const config = statusConfig[inquiry.status];
              const property = inquiry.propertyId;
              const agent = inquiry.agentId;
              return (
                <Card key={inquiry._id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-heading font-semibold">{property?.title ?? "Property"}</h3>
                        {property && (
                          <p className="text-sm text-muted-foreground font-body flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {propertyLocation(property)}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={`${config.color} shrink-0`}>{config.label}</Badge>
                    </div>

                    <div className="bg-muted rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
                        <Send className="h-3 w-3" /> You · {formatDistanceToNow(new Date(inquiry.createdAt), { addSuffix: true })}
                      </div>
                      <p className="text-sm font-body">{inquiry.message}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                      {agent && (
                        <p className="text-xs text-muted-foreground font-body">Agent: {agent.fullName}</p>
                      )}
                      {agent && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="font-body text-xs gap-1"
                          disabled={startingChatFor === inquiry._id}
                          onClick={() => handleMessageAgent(inquiry)}
                        >
                          {startingChatFor === inquiry._id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <MessageSquare className="h-3 w-3" />
                          }
                          Message Agent
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
