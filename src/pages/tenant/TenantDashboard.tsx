import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home, Search, Heart, FileText, MapPin, Calendar,
  MessageSquare, ChevronRight, CreditCard, Settings, Bell,
  MessagesSquare, Clock, Phone, Mail, User, TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  _id: string;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function firstName(fullName?: string) {
  return fullName?.split(" ")[0] ?? "there";
}

function initials(fullName?: string) {
  if (!fullName) return "?";
  return fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

const notifIcon: Record<string, React.ElementType> = {
  inquiry: MessageSquare,
  verification: FileText,
  property: Home,
  payment: CreditCard,
  earb: FileText,
  system: Bell,
};
const notifColor: Record<string, string> = {
  inquiry: "text-secondary",
  verification: "text-green-600",
  property: "text-blue-500",
  payment: "text-purple-500",
  earb: "text-amber-600",
  system: "text-muted-foreground",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function TenantDashboard() {
  const { user } = useAuth();

  // Active lease
  const { data: lease, isLoading: leaseLoading } = useQuery<Lease | null>({
    queryKey: ["myLease"],
    queryFn: async () => {
      const { data } = await api.get("/leases/my");
      return data?.data as Lease | null;
    },
    staleTime: 60_000,
  });

  // Conversations → unread messages count
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ["chatConversations"],
    queryFn: async () => {
      const { data } = await api.get("/chat");
      return data?.data as Array<{ _id: string; unread: number; lastMessage: string | null; lastMessageAt: string | null; participants: Array<{ _id: string; fullName: string }> }>;
    },
    staleTime: 30000,
  });

  // Notifications → unread count + recent activity
  const { data: notifData, isLoading: notifLoading } = useQuery({
    queryKey: ["tenantNotifications"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=6");
      return data as {
        data: { notifications: Array<{ _id: string; type: string; title: string; body: string; isRead: boolean; createdAt: string; link: string | null }>; unreadCount: number };
      };
    },
    staleTime: 30000,
  });

  // Saved properties count
  const { data: savedData } = useQuery({
    queryKey: ["savedProperties"],
    queryFn: async () => {
      const { data } = await api.get("/properties/saved");
      return data;
    },
    staleTime: 60_000,
  });

  const conversations = chatsData ?? [];
  const unreadMessages = conversations.reduce((s, c) => s + c.unread, 0);
  const unreadNotifs = notifData?.data?.unreadCount ?? 0;
  const recentActivity = notifData?.data?.notifications ?? [];
  const recentConvs = conversations.slice(0, 3);
  const savedCount = (savedData?.data?.savedProperties ?? savedData?.data ?? []).length;

  const myId = user?.id ?? "";

  const coverImage = lease
    ? lease.propertyId.images?.find((i) => i.isCover)?.url || lease.propertyId.images?.[0]?.url
    : undefined;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">
            Welcome back, {firstName(user?.fullName)} 👋
          </h1>
          <p className="text-muted-foreground font-body mt-1">
            Here's a summary of your activity on Dwelly Homes.
          </p>
        </div>
        <Button asChild className="bg-secondary hover:bg-secondary/90 shrink-0">
          <Link to="/"><Search className="h-4 w-4 mr-2" />Browse Properties</Link>
        </Button>
      </div>

      {/* Active Tenancy Banner */}
      {leaseLoading ? (
        <Skeleton className="h-36 w-full rounded-xl" />
      ) : lease ? (
        <Card className="border-green-200 bg-green-50/40 overflow-hidden">
          <div className="flex flex-col sm:flex-row">
            {coverImage && (
              <div className="w-full sm:w-44 h-32 sm:h-auto shrink-0 overflow-hidden">
                <img src={coverImage} alt={lease.propertyId.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex-1 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Active Tenancy</Badge>
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABEL[lease.propertyId.propertyType] ?? lease.propertyId.propertyType}
                    </Badge>
                  </div>
                  <p className="font-semibold font-heading">{lease.propertyId.title}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {[lease.propertyId.streetEstate, lease.propertyId.neighborhood, lease.propertyId.county].filter(Boolean).join(", ")}
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link to="/tenant/payments"><CreditCard className="h-3.5 w-3.5 mr-1.5" />View Details</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-medium">KES {lease.monthlyRent.toLocaleString()}</span>
                  <span className="text-muted-foreground text-xs">/month</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-secondary" />
                  <span className="text-muted-foreground text-xs">Since</span>
                  <span className="font-medium">{format(new Date(lease.leaseStart), "d MMM yyyy")}</span>
                </div>
                {lease.leaseEnd && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-muted-foreground text-xs">Until</span>
                    <span className="font-medium">{format(new Date(lease.leaseEnd), "d MMM yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Unread Messages",
            value: chatsLoading ? null : unreadMessages,
            icon: MessagesSquare,
            iconColor: "text-secondary",
            href: "/tenant/messages",
          },
          {
            label: "Notifications",
            value: notifLoading ? null : unreadNotifs,
            icon: Bell,
            iconColor: "text-blue-500",
            href: "/tenant/notifications",
          },
          {
            label: "Conversations",
            value: chatsLoading ? null : conversations.length,
            icon: MessageSquare,
            iconColor: "text-green-600",
            href: "/tenant/messages",
          },
          {
            label: "Saved Properties",
            value: savedCount,
            icon: Heart,
            iconColor: "text-destructive",
            href: "/tenant/saved",
          },
        ].map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  {stat.value === null ? (
                    <Skeleton className="h-7 w-8 mb-0.5" />
                  ) : (
                    <p className="text-2xl font-bold font-heading text-foreground">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-body">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left column ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Agent / Landlord card — only when onboarded */}
          {lease && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold text-foreground">Your Agent / Landlord</h2>
              </div>
              <Card>
                <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{lease.agentId.fullName}</p>
                      {lease.agentId.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {lease.agentId.phone}
                        </p>
                      )}
                      {lease.agentId.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {lease.agentId.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {lease.agentId.phone && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`tel:${lease.agentId.phone}`}><Phone className="h-3.5 w-3.5 mr-1.5" />Call</a>
                      </Button>
                    )}
                    {lease.agentId.email && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={`mailto:${lease.agentId.email}`}><Mail className="h-3.5 w-3.5 mr-1.5" />Email</a>
                      </Button>
                    )}
                    <Button size="sm" className="bg-secondary hover:bg-secondary/90" asChild>
                      <Link to="/tenant/messages"><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Message</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Recent Conversations */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Recent Messages</h2>
            <Button variant="ghost" size="sm" className="font-body text-secondary" asChild>
              <Link to="/tenant/messages">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>

          {chatsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center gap-3 animate-pulse">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentConvs.length === 0 ? (
            <Card>
              <CardContent className="p-8 flex flex-col items-center text-center gap-3">
                <MessagesSquare className="h-10 w-10 text-muted-foreground opacity-30" />
                <div>
                  <p className="font-medium text-sm">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Browse properties and click "Chat with Agent" to start a conversation.
                  </p>
                </div>
                <Button size="sm" asChild className="bg-secondary hover:bg-secondary/90">
                  <Link to="/">Browse Properties</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentConvs.map((conv) => {
                const other = conv.participants.find((p) => p._id !== myId);
                return (
                  <Link key={conv._id} to={`/tenant/messages?conv=${conv._id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                          {initials(other?.fullName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold truncate">{other?.fullName ?? "Unknown"}</p>
                            {conv.lastMessageAt && (
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {timeAgo(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.lastMessage ?? "No messages yet"}
                          </p>
                        </div>
                        {conv.unread > 0 && (
                          <span className="h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                            {conv.unread}
                          </span>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
              {conversations.length > 3 && (
                <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                  <Link to="/tenant/messages">View all {conversations.length} conversations</Link>
                </Button>
              )}
            </div>
          )}

          {/* Saved Properties */}
          <div className="flex items-center justify-between mt-2">
            <h2 className="font-heading text-lg font-semibold text-foreground">Saved Properties</h2>
            <Button variant="ghost" size="sm" className="font-body text-secondary" asChild>
              <Link to="/tenant/saved">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-8 flex flex-col items-center text-center gap-3">
              <Heart className="h-10 w-10 text-muted-foreground opacity-30" />
              <div>
                <p className="font-medium text-sm">
                  {savedCount > 0 ? `${savedCount} saved propert${savedCount === 1 ? "y" : "ies"}` : "No saved properties yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {savedCount > 0
                    ? "View your full saved list to book viewings or compare."
                    : "Tap the ♡ on any listing to save it here for later."}
                </p>
              </div>
              <Button size="sm" asChild className="bg-secondary hover:bg-secondary/90">
                {savedCount > 0
                  ? <Link to="/tenant/saved"><Heart className="h-4 w-4 mr-2" />View Saved</Link>
                  : <Link to="/"><Search className="h-4 w-4 mr-2" />Browse Properties</Link>
                }
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ─── Activity + Quick Actions ─────────────────────────────────────── */}
        <div className="space-y-4">
          {/* Recent Activity from notifications */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-semibold text-foreground">Recent Activity</h2>
            <Button variant="ghost" size="sm" className="text-secondary" asChild>
              <Link to="/tenant/notifications">View All <ChevronRight className="h-4 w-4 ml-1" /></Link>
            </Button>
          </div>
          <Card>
            {notifLoading ? (
              <CardContent className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            ) : recentActivity.length === 0 ? (
              <CardContent className="p-6 flex flex-col items-center text-center gap-2">
                <Clock className="h-8 w-8 text-muted-foreground opacity-30" />
                <p className="text-sm text-muted-foreground">No activity yet</p>
              </CardContent>
            ) : (
              <CardContent className="p-0 divide-y divide-border">
                {recentActivity.map((item) => {
                  const Icon = notifIcon[item.type] ?? Bell;
                  const color = notifColor[item.type] ?? "text-muted-foreground";
                  return (
                    <Link
                      key={item._id}
                      to={item.link ?? "/tenant/notifications"}
                      className="flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-body truncate ${!item.isRead ? "font-semibold" : ""}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{item.body}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.createdAt)}</p>
                      </div>
                      {!item.isRead && (
                        <span className="h-2 w-2 rounded-full bg-secondary mt-2 shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </CardContent>
            )}
          </Card>

          {/* Profile Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">My Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                  {initials(user?.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{user?.fullName ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email ?? "—"}</p>
                  {user?.phone && (
                    <p className="text-xs text-muted-foreground">{user.phone}</p>
                  )}
                </div>
              </div>
              {lease && (
                <div className="pt-1 border-t space-y-1">
                  <p className="text-xs text-muted-foreground">Tenancy as</p>
                  <p className="text-sm font-medium">{lease.occupantName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lease && (
                <Button variant="outline" className="w-full justify-start font-body" asChild>
                  <Link to="/tenant/payments"><CreditCard className="h-4 w-4 mr-2" />My Tenancy</Link>
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/"><Search className="h-4 w-4 mr-2" />Browse Properties</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/messages"><MessageSquare className="h-4 w-4 mr-2" />My Messages</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/bookings"><Calendar className="h-4 w-4 mr-2" />My Viewings</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/saved"><Heart className="h-4 w-4 mr-2" />Saved Properties</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/notifications"><Bell className="h-4 w-4 mr-2" />Notifications</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start font-body" asChild>
                <Link to="/tenant/profile"><Settings className="h-4 w-4 mr-2" />Account Settings</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
