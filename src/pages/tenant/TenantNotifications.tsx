import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, Home, CreditCard, MessageSquare, FileText,
  ShieldCheck, CheckCheck, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notif {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  link: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  inquiry:      { icon: MessageSquare, color: "text-secondary",          bg: "bg-secondary/10" },
  verification: { icon: ShieldCheck,   color: "text-green-600",          bg: "bg-green-50" },
  property:     { icon: Home,          color: "text-blue-600",           bg: "bg-blue-50" },
  payment:      { icon: CreditCard,    color: "text-purple-600",         bg: "bg-purple-50" },
  earb:         { icon: FileText,      color: "text-amber-600",          bg: "bg-amber-50" },
  system:       { icon: Bell,          color: "text-muted-foreground",   bg: "bg-muted" },
};

const TABS = ["All", "Unread", "Inquiries", "Property", "Payments", "System"] as const;
type Tab = typeof TABS[number];

const tabTypeMap: Record<Tab, string | null> = {
  All:       null,
  Unread:    null,
  Inquiries: "inquiry",
  Property:  "property",
  Payments:  "payment",
  System:    "system",
};

function resolveRoute(link: string | null, type: string): string {
  if (link) {
    if (link.startsWith("/dashboard") || link.startsWith("/admin")) return "/tenant";
    return link;
  }
  const fallbacks: Record<string, string> = {
    inquiry:      "/tenant/bookings",
    property:     "/",
    payment:      "/tenant/payments",
    verification: "/tenant/profile",
    earb:         "/tenant/profile",
    system:       "/tenant/notifications",
  };
  return fallbacks[type] ?? "/tenant";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TenantNotifications() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("All");
  const [page, setPage] = useState(1);

  const typeFilter = tabTypeMap[tab];

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["tenantNotifPage", tab, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20", page: String(page) });
      if (typeFilter) params.set("type", typeFilter);
      const { data } = await api.get(`/notifications?${params}`);
      return data as {
        data: { notifications: Notif[]; unreadCount: number };
        meta: { total: number; totalPages: number; page: number };
      };
    },
    staleTime: 15000,
  });

  const notifications = data?.data?.notifications ?? [];
  const unreadCount   = data?.data?.unreadCount   ?? 0;
  const totalPages    = data?.meta?.totalPages     ?? 1;

  // client-side filter for "Unread" tab (same query, just filter)
  const displayed = tab === "Unread" ? notifications.filter((n) => !n.isRead) : notifications;

  // ── Mark single read ──
  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantNotifPage"] });
      queryClient.invalidateQueries({ queryKey: ["tenantNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationBell"] });
    },
  });

  // ── Mark all read ──
  const markAll = useMutation({
    mutationFn: () => api.patch("/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenantNotifPage"] });
      queryClient.invalidateQueries({ queryKey: ["tenantNotifications"] });
      queryClient.invalidateQueries({ queryKey: ["notificationBell"] });
      toast({ title: "All notifications marked as read" });
    },
  });

  function handleClick(n: Notif) {
    if (!n.isRead) markRead.mutate(n._id);
    navigate(resolveRoute(n.link, n.type));
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    setPage(1);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">{unreadCount} new</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Stay updated on your tenancy and property search.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs shrink-0"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            {markAll.isPending
              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <CheckCheck className="h-3.5 w-3.5 mr-1.5" />}
            Mark all read
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
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
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))
        ) : displayed.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">You're all caught up!</p>
            <p className="text-sm text-muted-foreground">No notifications in this category.</p>
          </div>
        ) : (
          displayed.map((n) => {
            const tc = typeConfig[n.type] ?? typeConfig.system;
            const Icon = tc.icon;
            return (
              <button
                key={n._id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left flex gap-4 p-4 rounded-xl border transition-colors hover:bg-muted/30 cursor-pointer",
                  !n.isRead && "bg-background border-l-4 border-l-primary"
                )}
              >
                <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0", tc.bg)}>
                  <Icon className={cn("h-5 w-5", tc.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm", !n.isRead && "font-semibold")}>{n.title}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                </div>
                {!n.isRead && (
                  <span className="h-2 w-2 rounded-full bg-secondary mt-2 shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Next"}
          </Button>
        </div>
      )}
    </div>
  );
}
