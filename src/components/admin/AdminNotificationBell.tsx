import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, ChevronLeft, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  ADMIN_NOTIFICATION_DEFAULT_PREFERENCES,
  ADMIN_NOTIFICATION_PREFERENCE_LABELS,
  ADMIN_NOTIFICATION_PREFERENCE_KEYS,
  type AdminNotification,
  type AdminNotificationPreferences,
  resolveAdminNotificationRoute,
  timeAgo,
} from "./adminNotificationUtils";

interface NotificationsResponse {
  data?: {
    notifications?: AdminNotification[];
    unreadCount?: number;
  };
}

interface PreferencesResponse {
  data?: AdminNotificationPreferences;
}

export function AdminNotificationBell() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const lastSeenAt = useRef<string>(new Date().toISOString());

  const ready = isAuthenticated && !isLoading;

  const { data: notifData } = useQuery({
    queryKey: ["adminNotifications", "bell"],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>("/notifications?limit=10", { _silent: true });
      return data;
    },
    enabled: ready,
    refetchInterval: 60000,
    retry: false,
    staleTime: 30000,
  });

  const { data: newData } = useQuery({
    queryKey: ["adminNotifications", "poll"],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>(`/notifications?since=${lastSeenAt.current}&limit=5`, { _silent: true });
      return data;
    },
    enabled: ready,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 30000,
  });

  const { data: prefsData } = useQuery({
    queryKey: ["adminNotificationPreferences"],
    queryFn: async () => {
      const { data } = await api.get<PreferencesResponse>("/notifications/preferences", { _silent: true });
      return data?.data;
    },
    enabled: ready,
    retry: false,
    staleTime: 120000,
  });

  const prefsMutation = useMutation({
    mutationFn: (prefs: Partial<AdminNotificationPreferences>) => api.patch("/notifications/preferences", prefs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotificationPreferences"] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminNotifications"] });
    },
  });

  useEffect(() => {
    const newNotifs: AdminNotification[] = newData?.data?.notifications ?? [];
    if (!newNotifs.length) return;

    const prefs = prefsData ?? ADMIN_NOTIFICATION_DEFAULT_PREFERENCES;

    newNotifs.forEach((n) => {
      const key = n.type as keyof AdminNotificationPreferences;
      if (prefs[key] === false) return;

      toast(n.title, {
        description: n.body,
        action: {
          label: "View",
          onClick: () => {
            navigate(resolveAdminNotificationRoute(n.link, n.type));
            markReadMutation.mutate(n._id);
          },
        },
        duration: 6000,
      });
    });

    lastSeenAt.current = new Date().toISOString();
    qc.invalidateQueries({ queryKey: ["adminNotifications"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newData]);

  const notifications: AdminNotification[] = notifData?.data?.notifications ?? [];
  const unreadCount = notifData?.data?.unreadCount ?? 0;
  const prefs = prefsData ?? ADMIN_NOTIFICATION_DEFAULT_PREFERENCES;

  const handleNotifClick = (n: AdminNotification) => {
    if (!n.isRead) {
      markReadMutation.mutate(n._id);
    }
    setOpen(false);
    navigate(resolveAdminNotificationRoute(n.link, n.type));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full" aria-label="Open admin notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground flex items-center justify-center px-0.5">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {!showPrefs ? (
          <>
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
                  aria-label="Notification settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

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
                    {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-secondary shrink-0" />}
                    {n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <button
                        className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          markReadMutation.mutate(n._id);
                        }}
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </ScrollArea>

            <div className="border-t px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setOpen(false);
                  navigate("/admin/notifications");
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowPrefs(false)} aria-label="Back">
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="font-semibold text-sm">Notification Settings</span>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Choose which notifications appear as popups.</p>
              {ADMIN_NOTIFICATION_PREFERENCE_KEYS.map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm">{ADMIN_NOTIFICATION_PREFERENCE_LABELS[key]}</span>
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
