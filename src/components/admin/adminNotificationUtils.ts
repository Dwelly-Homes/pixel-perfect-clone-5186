import { AlertTriangle, Bell, CreditCard, FileText, Home, ShieldCheck } from "lucide-react";
import type { ElementType } from "react";

export interface AdminNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AdminNotificationPreferences {
  inquiry: boolean;
  verification: boolean;
  property: boolean;
  payment: boolean;
  earb: boolean;
  system: boolean;
}

export type AdminNotificationPreferenceKey = keyof AdminNotificationPreferences;

export const ADMIN_NOTIFICATION_PREFERENCE_KEYS: AdminNotificationPreferenceKey[] = [
  "inquiry",
  "verification",
  "property",
  "payment",
  "earb",
  "system",
];

export const ADMIN_NOTIFICATION_PREFERENCE_LABELS: Record<AdminNotificationPreferenceKey, string> = {
  inquiry: "Inquiries",
  verification: "Verification",
  property: "Properties",
  payment: "Payments",
  earb: "EARB",
  system: "System",
};

export const ADMIN_NOTIFICATION_DEFAULT_PREFERENCES: AdminNotificationPreferences = {
  inquiry: true,
  verification: true,
  property: true,
  payment: true,
  earb: true,
  system: true,
};

export const ADMIN_NOTIFICATION_TABS = ["All", "Unread", "Verification", "Payments", "Properties", "System"] as const;
export type AdminNotificationTab = (typeof ADMIN_NOTIFICATION_TABS)[number];

export const ADMIN_NOTIFICATION_TYPE_ICON: Record<string, ElementType> = {
  property: Home,
  inquiry: Home,
  verification: FileText,
  payment: CreditCard,
  earb: ShieldCheck,
  warning: AlertTriangle,
  system: Bell,
};

export const ADMIN_NOTIFICATION_TYPE_COLOR: Record<string, string> = {
  property: "text-blue-600 bg-blue-50",
  inquiry: "text-blue-600 bg-blue-50",
  verification: "text-green-600 bg-green-50",
  payment: "text-purple-600 bg-purple-50",
  earb: "text-amber-600 bg-amber-50",
  warning: "text-amber-600 bg-amber-50",
  system: "text-gray-600 bg-gray-100",
};

export function resolveAdminNotificationRoute(link: string | null, type: string): string {
  if (link?.startsWith("/admin/")) {
    return link;
  }

  switch (type) {
    case "verification":
      return "/admin/verifications";
    case "property":
      return "/admin/properties";
    case "payment":
      return "/admin/billing";
    case "earb":
      return "/admin/earb";
    default:
      return "/admin/notifications";
  }
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function filterAdminNotifications(notifications: AdminNotification[], tab: AdminNotificationTab): AdminNotification[] {
  if (tab === "All") return notifications;
  if (tab === "Unread") return notifications.filter((n) => !n.isRead);
  if (tab === "Verification") return notifications.filter((n) => n.type === "verification" || n.type === "earb");
  if (tab === "Payments") return notifications.filter((n) => n.type === "payment");
  if (tab === "Properties") return notifications.filter((n) => n.type === "property" || n.type === "inquiry");
  if (tab === "System") return notifications.filter((n) => n.type === "system" || n.type === "warning");
  return notifications;
}
