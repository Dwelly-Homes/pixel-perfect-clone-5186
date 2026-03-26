import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Home, FileText, CreditCard, AlertTriangle, CheckCheck, Settings, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api, getApiError } from "@/lib/api";
import { toast } from "sonner";

const typeIcon: Record<string, React.ElementType> = {
  property: Home,
  inquiry: Home,
  verification: FileText,
  payment: CreditCard,
  earb: ShieldCheck,
  warning: AlertTriangle,
  system: Bell,
};

const typeColor: Record<string, string> = {
  property:     "text-blue-600 bg-blue-50",
  inquiry:      "text-blue-600 bg-blue-50",
  verification: "text-green-600 bg-green-50",
  payment:      "text-purple-600 bg-purple-50",
  earb:         "text-amber-600 bg-amber-50",
  warning:      "text-amber-600 bg-amber-50",
  system:       "text-gray-600 bg-gray-100",
};

const tabs = ["All", "Unread", "Verification", "Payments", "Properties", "System"];

type PrefKey = "inquiry" | "verification" | "property" | "payment" | "earb" | "system";
const PREF_KEYS: PrefKey[] = ["inquiry", "verification", "property", "payment", "earb", "system"];
const prefLabel: Record<PrefKey, string> = {
  inquiry: "Inquiries", verification: "Verification", property: "Properties",
  payment: "Payments", earb: "EARB", system: "System",
};

function resolveRoute(link: string | null, type: string): string {
  if (link) {
    if (link.match(/^\/dashboard\/inquiries\/[a-f0-9]+$/i)) return "/dashboard/inquiries";
    if (link.match(/^\/dashboard\/viewings\/[a-f0-9]+$/i)) return "/dashboard/viewings";
    if (link.startsWith("/dashboard/") || link.startsWith("/admin/")) return link;
  }
  switch (type) {
    case "inquiry":      return "/dashboard/inquiries";
    case "verification": return "/dashboard/verification";
    case "property":     return "/dashboard/properties";
    case "payment":      return "/dashboard/billing";
    case "earb":         return "/dashboard/verification";
    default:             return "/dashboard/notifications";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function filterNotifs(notifications: any[], tab: string) {
  if (tab === "All")          return notifications;
  if (tab === "Unread")       return notifications.filter((n) => !n.isRead);
  if (tab === "Verification") return notifications.filter((n) => n.type === "verification" || n.type === "earb");
  if (tab === "Payments")     return notifications.filter((n) => n.type === "payment");
  if (tab === "Properties")   return notifications.filter((n) => n.type === "property" || n.type === "inquiry");
  if (tab === "System")       return notifications.filter((n) => n.type === "system" || n.type === "warning");
  return notifications;
}

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("All");
  const [page, setPage] = useState(1);
  const [showPrefs, setShowPrefs] = useState(false);
  const PER_PAGE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", page],
    queryFn: async () => {
      const { data } = await api.get(`/notifications?page=${page}&limit=${PER_PAGE}`);
      return data;
    },
  });

  const { data: prefsData, refetch: refetchPrefs } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/preferences");
      return data?.data as Record<PrefKey, boolean> | undefined;
    },
  });

  const prefsMutation = useMutation({
    mutationFn: (patch: Partial<Record<PrefKey, boolean>>) =>
      api.patch("/notifications/preferences", patch),
    onSuccess: () => {
      refetchPrefs();
      toast.success("Preferences saved");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationBell"] });
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationBell"] });
    },
  });

  const notifications = Array.isArray(data?.data?.notifications) ? data.data.notifications : [];
  const filtered = filterNotifs(notifications, tab);
  const unread = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

  const prefs: Record<PrefKey, boolean> = prefsData ?? {
    inquiry: true, verification: true, property: true, payment: true, earb: true, system: true,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClick = (n: any) => {
    if (!n.isRead) markOneMutation.mutate(n._id);
    navigate(resolveRoute(n.link, n.type));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold">Notifications</h1>
            {unread > 0 && (
              <Badge className="bg-secondary text-secondary-foreground">{unread} new</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Stay up to date with your property activities.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Mark all as read
            </Button>
          )}
          <Button
            variant={showPrefs ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowPrefs((v) => !v)}
            title="Notification settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preferences panel */}
      {showPrefs && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Popup notification settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Choose which notification types show as popups in real-time.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PREF_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => prefsMutation.mutate({ [key]: !prefs[key] })}
                disabled={prefsMutation.isPending}
                className={cn(
                  "flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                  prefs[key]
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-border bg-muted/40 text-muted-foreground"
                )}
              >
                <span className="font-medium">{prefLabel[key]}</span>
                <span
                  className={cn(
                    "relative inline-flex h-4 w-7 rounded-full transition-colors ml-2 shrink-0",
                    prefs[key] ? "bg-secondary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-3 w-3 rounded-full bg-white shadow transform transition-transform mt-0.5",
                      prefs[key] ? "translate-x-3.5" : "translate-x-0.5"
                    )}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border animate-pulse">
              <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">You are all caught up!</p>
            <p className="text-sm text-muted-foreground">No notifications here.</p>
          </div>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          filtered.map((n: any) => {
            const Icon = typeIcon[n.type] ?? Bell;
            return (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                className={cn(
                  "flex gap-4 p-4 rounded-xl border transition-colors cursor-pointer hover:bg-muted/30",
                  !n.isRead && "bg-background border-l-4 border-l-primary"
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                    typeColor[n.type] || typeColor.system
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                  {n.link && (
                    <p className="text-xs text-secondary mt-1 font-medium">Click to view →</p>
                  )}
                </div>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-secondary mt-2 shrink-0" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Load more */}
      {data?.meta && data.meta.page < data.meta.totalPages && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
