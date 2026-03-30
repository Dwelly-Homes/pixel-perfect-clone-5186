import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Settings } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, getApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ADMIN_NOTIFICATION_DEFAULT_PREFERENCES,
  ADMIN_NOTIFICATION_PREFERENCE_LABELS,
  ADMIN_NOTIFICATION_PREFERENCE_KEYS,
  ADMIN_NOTIFICATION_TABS,
  ADMIN_NOTIFICATION_TYPE_COLOR,
  ADMIN_NOTIFICATION_TYPE_ICON,
  filterAdminNotifications,
  resolveAdminNotificationRoute,
  timeAgo,
  type AdminNotification,
  type AdminNotificationPreferenceKey,
  type AdminNotificationPreferences,
  type AdminNotificationTab,
} from "@/components/admin/adminNotificationUtils";

interface NotificationsResponse {
  data?: {
    notifications?: AdminNotification[];
    unreadCount?: number;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

interface PreferencesResponse {
  data?: AdminNotificationPreferences;
}

const PER_PAGE = 20;

export default function AdminNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<AdminNotificationTab>("All");
  const [page, setPage] = useState(1);
  const [showPrefs, setShowPrefs] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["adminNotifications", "list", page],
    queryFn: async () => {
      const { data } = await api.get<NotificationsResponse>(`/notifications?page=${page}&limit=${PER_PAGE}`);
      return data;
    },
  });

  const { data: prefsData } = useQuery({
    queryKey: ["adminNotificationPreferences"],
    queryFn: async () => {
      const { data } = await api.get<PreferencesResponse>("/notifications/preferences");
      return data?.data;
    },
  });

  const prefsMutation = useMutation({
    mutationFn: (patch: Partial<Record<AdminNotificationPreferenceKey, boolean>>) =>
      api.patch("/notifications/preferences", patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNotificationPreferences"] });
      toast.success("Preferences saved");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const markAllMutation = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminNotifications"] });
    },
  });

  const notifications = Array.isArray(data?.data?.notifications) ? data.data.notifications : [];
  const filtered = filterAdminNotifications(notifications, tab);
  const unread = data?.data?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const prefs = prefsData ?? ADMIN_NOTIFICATION_DEFAULT_PREFERENCES;

  const handleClick = (n: AdminNotification) => {
    if (!n.isRead) {
      markOneMutation.mutate(n._id);
    }
    navigate(resolveAdminNotificationRoute(n.link, n.type));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-heading font-bold">Platform Notifications</h1>
            {unread > 0 && (
              <Badge className="bg-secondary text-secondary-foreground">{unread} new</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track verification, billing, and system updates in one place.
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
            onClick={() => setShowPrefs((value) => !value)}
            title="Notification settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showPrefs && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Popup notification settings</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Choose which notification types show as popups in real time.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ADMIN_NOTIFICATION_PREFERENCE_KEYS.map((key) => (
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
                  <span className="font-medium">{ADMIN_NOTIFICATION_PREFERENCE_LABELS[key]}</span>
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
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {ADMIN_NOTIFICATION_TABS.map((t) => (
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

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 animate-pulse">
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
                <p className="text-sm text-muted-foreground">No notifications in this category.</p>
              </div>
            ) : (
              filtered.map((n) => {
                const Icon = ADMIN_NOTIFICATION_TYPE_ICON[n.type] ?? Bell;
                return (
                  <button
                    key={n._id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left flex gap-4 p-4 transition-colors hover:bg-muted/30",
                      !n.isRead && "bg-background border-l-4 border-l-primary"
                    )}
                  >
                    <div
                      className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                        ADMIN_NOTIFICATION_TYPE_COLOR[n.type] || ADMIN_NOTIFICATION_TYPE_COLOR.system
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                      <div className="mt-1 flex items-center gap-2">
                        {n.link && <p className="text-xs text-secondary font-medium">Click to view -&gt;</p>}
                      </div>
                    </div>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-secondary mt-2 shrink-0" />}
                    {!n.isRead && (
                      <button
                        className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          markOneMutation.mutate(n._id);
                        }}
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {data?.meta && data.meta.page && data.meta.totalPages && data.meta.page < data.meta.totalPages && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => setPage((value) => value + 1)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
