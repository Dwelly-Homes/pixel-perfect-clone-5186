import { useState } from "react";
import { Bell, Home, FileText, CreditCard, AlertTriangle, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const mockNotifications = [
  { id: "1", type: "property", title: "New inquiry received", body: "Sarah Wanjiku has sent an inquiry about Modern 2BR in Kilimani.", time: "2024-06-20T09:30:00", read: false, link: "/dashboard/inquiries" },
  { id: "2", type: "verification", title: "Verification approved", body: "Congratulations! Your organization has been verified. You can now post property listings.", time: "2024-06-19T14:00:00", read: false, link: "/dashboard/verification" },
  { id: "3", type: "payment", title: "Payment confirmed", body: "Your Professional Plan subscription payment of KES 4,500 was received. Receipt: MPESA-XYZ123.", time: "2024-06-18T10:30:00", read: true, link: "/dashboard/billing" },
  { id: "4", type: "property", title: "Viewing request", body: "Michael Otieno has requested a viewing for Cozy Studio in Westlands this Saturday morning.", time: "2024-06-17T16:45:00", read: true, link: "/dashboard/viewings" },
  { id: "5", type: "warning", title: "EARB certificate expiring soon", body: "Your EARB practicing certificate expires in 25 days. Please renew it to keep your listings active.", time: "2024-06-16T08:00:00", read: false, link: "/dashboard/verification" },
  { id: "6", type: "system", title: "Welcome to Dwelly Homes!", body: "Your account has been created. Complete your verification to start listing properties.", time: "2024-06-01T12:00:00", read: true, link: "/dashboard" },
  { id: "7", type: "payment", title: "Commission payment due", body: "A commission of KES 2,800 is due for the move-in of Grace Akinyi to Elegant 1BR in Lavington.", time: "2024-06-15T09:00:00", read: true, link: "/dashboard/commissions" },
];

const typeIcon: Record<string, React.ElementType> = {
  property: Home,
  verification: FileText,
  payment: CreditCard,
  warning: AlertTriangle,
  system: Bell,
};

const typeColor: Record<string, string> = {
  property: "text-blue-600 bg-blue-50",
  verification: "text-green-600 bg-green-50",
  payment: "text-purple-600 bg-purple-50",
  warning: "text-amber-600 bg-amber-50",
  system: "text-gray-600 bg-gray-100",
};

const tabs = ["All", "Unread", "Verification", "Payments", "Properties", "System"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

export default function Notifications() {
  const { toast } = useToast();
  const [tab, setTab] = useState("All");
  const [notifications, setNotifications] = useState(mockNotifications);
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  function markAllRead() {
    setNotifications((n) => n.map((item) => ({ ...item, read: true })));
    toast({ title: "All notifications marked as read" });
  }

  function markRead(id: string) {
    setNotifications((n) => n.map((item) => item.id === id ? { ...item, read: true } : item));
  }

  const filtered = notifications.filter((n) => {
    if (tab === "All") return true;
    if (tab === "Unread") return !n.read;
    if (tab === "Verification") return n.type === "verification";
    if (tab === "Payments") return n.type === "payment";
    if (tab === "Properties") return n.type === "property";
    if (tab === "System") return n.type === "system" || n.type === "warning";
    return true;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold">Notifications</h1>
            {unread > 0 && <Badge className="bg-secondary text-secondary-foreground">{unread} new</Badge>}
          </div>
          <p className="text-sm text-muted-foreground mt-1">Stay up to date with your property activities.</p>
        </div>
        {unread > 0 && (
          <Button variant="ghost" size="sm" className="text-xs shrink-0" onClick={markAllRead}>
            <CheckCheck className="h-3.5 w-3.5 mr-1.5" />Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {paginated.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">You are all caught up!</p>
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </div>
        ) : (
          paginated.map((n) => {
            const Icon = typeIcon[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex gap-4 p-4 rounded-xl border transition-colors cursor-pointer hover:bg-muted/30",
                  !n.read && "bg-background border-l-4 border-l-primary"
                )}
              >
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", typeColor[n.type])}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(n.time)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {paginated.length < filtered.length && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
