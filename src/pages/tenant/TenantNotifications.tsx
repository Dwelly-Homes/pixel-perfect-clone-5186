import { useState } from "react";
import { Bell, Home, CreditCard, Calendar, MessageSquare, AlertTriangle, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type NType = "payment" | "viewing" | "message" | "property" | "warning" | "system";

interface Notification {
  id: string;
  type: NType;
  title: string;
  body: string;
  time: string;
  read: boolean;
  link: string;
}

const MOCK: Notification[] = [
  { id: "1", type: "payment", title: "Rent due in 10 days", body: "Your rent of KES 65,000 for 2BR Apartment, Kilimani is due on 1 July 2024. Pay early to avoid late fees.", time: "2024-06-21T08:00:00", read: false, link: "/tenant/payments" },
  { id: "2", type: "viewing", title: "Viewing confirmed", body: "Your viewing of Modern 2BR Apartment in Kilimani is confirmed for 28 Mar at 9am. Agent: James Mwangi.", time: "2024-06-20T14:30:00", read: false, link: "/tenant/bookings" },
  { id: "3", type: "message", title: "Reply from James Mwangi", body: "James replied to your inquiry: \"Yes, the property is still available! I can arrange a viewing this weekend.\"", time: "2024-06-19T10:15:00", read: false, link: "/tenant/messages" },
  { id: "4", type: "property", title: "Price drop on saved property", body: "Spacious Studio in Westlands dropped from KES 40,000 to KES 35,000/mo. Check it out!", time: "2024-06-18T09:00:00", read: true, link: "/tenant/saved" },
  { id: "5", type: "warning", title: "Saved property no longer available", body: "3BR Garden Villa in Karen has been rented out and is no longer available.", time: "2024-06-17T11:30:00", read: true, link: "/tenant/saved" },
  { id: "6", type: "payment", title: "Payment received", body: "Your rent payment of KES 65,000 for June 2024 was successfully processed. M-Pesa code: SHL4K7X9QR.", time: "2024-06-01T09:00:00", read: true, link: "/tenant/payments" },
  { id: "7", type: "system", title: "Welcome to Dwelly Homes!", body: "Your tenant account is active. Complete your profile to get matched with properties faster.", time: "2024-05-28T12:00:00", read: true, link: "/tenant/onboarding" },
];

const typeConfig: Record<NType, { icon: React.ElementType; color: string; bg: string }> = {
  payment: { icon: CreditCard, color: "text-green-600", bg: "bg-green-50" },
  viewing: { icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
  message: { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-50" },
  property: { icon: Home, color: "text-secondary", bg: "bg-secondary/10" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  system: { icon: Bell, color: "text-gray-500", bg: "bg-gray-100" },
};

const TABS = ["All", "Unread", "Payments", "Viewings", "Messages"] as const;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export default function TenantNotifications() {
  const { toast } = useToast();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [notifications, setNotifications] = useState(MOCK);

  const unread = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({ title: "All notifications marked as read" });
  }

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  const filtered = notifications.filter((n) => {
    if (tab === "Unread") return !n.read;
    if (tab === "Payments") return n.type === "payment";
    if (tab === "Viewings") return n.type === "viewing";
    if (tab === "Messages") return n.type === "message";
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold">Notifications</h1>
            {unread > 0 && <Badge className="bg-destructive text-destructive-foreground">{unread} new</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Stay updated on your tenancy and property search.</p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">You're all caught up!</p>
            <p className="text-sm text-muted-foreground">No notifications in this category.</p>
          </div>
        ) : filtered.map((n) => {
          const tc = typeConfig[n.type];
          const Icon = tc.icon;
          return (
            <Link
              key={n.id}
              to={n.link}
              onClick={() => markRead(n.id)}
              className={cn(
                "flex gap-4 p-4 rounded-xl border transition-colors hover:bg-muted/30 cursor-pointer",
                !n.read && "bg-background border-l-4 border-l-primary"
              )}
            >
              <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", tc.bg)}>
                <Icon className={cn("h-5 w-5", tc.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(n.time)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
