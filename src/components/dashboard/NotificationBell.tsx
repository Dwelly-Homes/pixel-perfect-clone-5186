import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, CheckCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface Notification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

interface Preferences {
  inquiry: boolean;
  verification: boolean;
  property: boolean;
  payment: boolean;
  earb: boolean;
  system: boolean;
}

// Map notification links to valid frontend routes
function resolveRoute(link: string | null, type: string): string {
  if (!link) return resolveByType(type);
  // Already a valid dashboard/admin route
  if (link.startsWith("/dashboard/") || link.startsWith("/admin/")) {
    // Strip sub-resource IDs that don't have dedicated pages
    if (link.match(/^\/dashboard\/inquiries\/[a-f0-9]+$/i)) return "/dashboard/inquiries";
    if (link.match(/^\/dashboard\/viewings\/[a-f0-9]+$/i)) return "/dashboard/viewings";
    return link;
  }
  return resolveByType(type);
}

function resolveByType(type: string): string {
  switch (type) {
    case "inquiry": return "/dashboard/inquiries";
    case "verification": return "/dashboard/verification";
    case "property": return "/dashboard/properties";
    case "payment": return "/dashboard/billing";
    case "earb": return "/dashboard/verification";
    case "system": return "/dashboard/notifications";
    default: return "/dashboard/notifications";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const lastSeenAt = useRef<string>(new Date().toISOString());

  const ready = isAuthenticated && !isLoading;

  // Recent notifications for the dropdown (latest 10)
  const { data: notifData } = useQuery({
    queryKey: ["notificationBell"],
    queryFn: async () => {
      const { data } = await api.get("/notifications?limit=10", { _silent: true });
      return data;
    },
    enabled: ready,
    refetchInterval: 60000,
    retry: false,
    staleTime: 30000,
  });

  // Poll for NEW notifications since last seen (for toast popups)
  const { data: newData } = useQuery({
    queryKey: ["notificationsPoll"],
    queryFn: async () => {
      const { data } = await api.get(`/notifications?since=${lastSeenAt.current}&limit=5`, { _silent: true });
      return data;
    },
    enabled: ready,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 30000,
  });

  // Preferences
  const { data: prefsData, refetch: refetchPrefs } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const { data } = await api.get("/notifications/preferences", { _silent: true });
      return data?.data as Preferences | undefined;
    },
    enabled: ready,
    retry: false,
    staleTime: 120000,
  });

  const prefsMutation = useMutation({
    mutationFn: (prefs: Partial<Preferences>) => api.patch("/notifications/preferences", prefs),
    onSuccess: () => refetchPrefs(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationBell"] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationBell"] }),
  });

  // Show toasts for new notifications respecting user preferences
  useEffect(() => {
    const newNotifs: Notification[] = newData?.data?.notifications ?? [];
    if (!newNotifs.length) return;

    const prefs: Preferences = prefsData ?? {
      inquiry: true, verification: true, property: true, payment: true, earb: true, system: true,
    };

    newNotifs.forEach((n) => {
      const type = n.type as keyof Preferences;
      if (prefs[type] === false) return;

      toast(n.title, {
        description: n.body,
        action: {
          label: "View",
          onClick: () => {
            navigate(resolveRoute(n.link, n.type));
            markReadMutation.mutate(n._id);
          },
        },
        duration: 6000,
      });
    });

    // Advance the cursor so we don't re-toast the same notifications
    lastSeenAt.current = new Date().toISOString();
    qc.invalidateQueries({ queryKey: ["notificationBell"] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newData]);

  const notifications: Notification[] = notifData?.data?.notifications ?? [];
  const unreadCount: number = notifData?.data?.unreadCount ?? 0;
  const prefs: Preferences = prefsData ?? {
    inquiry: true, verification: true, property: true, payment: true, earb: true, system: true,
  };

  const handleNotifClick = (n: Notification) => {
    if (!n.isRead) markReadMutation.mutate(n._id);
    setOpen(false);
    navigate(resolveRoute(n.link, n.type));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {!showPrefs ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="font-semibold text-sm">Notifications</span>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => markAllMutation.mutate()}
                    disabled={markAllMutation.isPending}
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowPrefs(true)}
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* List */}
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleNotifClick(n)}
                    onKeyDown={(e) => e.key === "Enter" && handleNotifClick(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors flex gap-3 items-start cursor-pointer",
                      !n.isRead && "bg-secondary/10"
                    )}
                  >
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />
                    )}
                    {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); markReadMutation.mutate(n._id); }}
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => { setOpen(false); navigate("/dashboard/notifications"); }}
              >
                View all notifications
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Preferences header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPrefs(false)}>
                ←
              </Button>
              <span className="font-semibold text-sm">Notification Settings</span>
            </div>

            {/* Preferences toggles */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Choose which notifications appear as popups.</p>
              {(Object.keys(prefs) as (keyof Preferences)[]).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{key === "earb" ? "EARB" : key}</span>
                  <button
                    role="switch"
                    aria-checked={prefs[key]}
                    onClick={() => prefsMutation.mutate({ [key]: !prefs[key] })}
                    className={cn(
                      "relative inline-flex h-5 w-9 rounded-full transition-colors focus:outline-none",
                      prefs[key] ? "bg-secondary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform mt-0.5",
                        prefs[key] ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
