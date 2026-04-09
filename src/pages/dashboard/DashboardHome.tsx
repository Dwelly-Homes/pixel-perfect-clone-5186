import { useQuery } from "@tanstack/react-query";
import { Building2, Eye, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { transformProperty } from "@/lib/propertyTransform";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&q=60";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] ?? "there";

  // Recent properties for the list card (limit 3)
  const { data: propertiesData } = useQuery({
    queryKey: ["dashboardProperties"],
    queryFn: async () => {
      const { data } = await api.get("/properties?limit=3&sort=createdAt&order=desc");
      return data;
    },
  });

  // All properties for aggregate stats (views, occupancy)
  const { data: allPropsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardAllProperties"],
    queryFn: async () => {
      const { data } = await api.get("/properties?limit=500");
      return data;
    },
  });

  const { data: inquiriesData, isLoading: inquiriesLoading } = useQuery({
    queryKey: ["dashboardInquiries"],
    queryFn: async () => {
      const { data } = await api.get("/inquiries?limit=5&sort=createdAt&order=desc");
      return data;
    },
  });

  const { data: inquiriesCountData } = useQuery({
    queryKey: ["dashboardInquiriesCount"],
    queryFn: async () => {
      const { data } = await api.get("/inquiries?limit=1&status=new");
      return data;
    },
  });

  const totalProperties: number = allPropsData?.meta?.total ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProperties: any[] = Array.isArray(allPropsData?.data) ? allPropsData.data : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentInquiries: any[] = Array.isArray(inquiriesData?.data) ? inquiriesData.data : [];
  const totalInquiries: number = inquiriesData?.meta?.total ?? recentInquiries.length;
  const newInquiries: number = inquiriesCountData?.meta?.total ?? recentInquiries.filter((i) => i.status === "new").length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any[] = Array.isArray(propertiesData?.data) ? propertiesData.data : [];

  const totalViews = allProperties.reduce((sum, p) => sum + (p.viewCount ?? 0), 0);
  const occupiedCount = allProperties.filter((p) => p.status === "occupied").length;
  const occupancyRate = allProperties.length > 0
    ? Math.round((occupiedCount / allProperties.length) * 100)
    : 0;

  const stats = [
    {
      label: "Total Properties",
      value: statsLoading ? null : totalProperties,
      icon: Building2,
      trend: "on your account",
    },
    {
      label: "Total Views",
      value: statsLoading ? null : totalViews,
      icon: Eye,
      trend: "across all listings",
    },
    {
      label: "Active Inquiries",
      value: inquiriesLoading ? null : totalInquiries,
      icon: MessageSquare,
      trend: `${newInquiries} new`,
    },
    {
      label: "Occupancy Rate",
      value: statsLoading ? null : `${occupancyRate}%`,
      icon: TrendingUp,
      trend: `${occupiedCount} of ${totalProperties} occupied`,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Welcome back, {firstName}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening with your properties today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground font-body">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {stat.value === null ? (
                <Skeleton className="h-8 w-16 mb-1" />
              ) : (
                <div className="text-2xl font-bold font-heading">{stat.value}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Recent Inquiries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentInquiries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No inquiries yet.</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              recentInquiries.map((inq: any) => (
                <div key={inq._id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{inq.senderName}</p>
                    <p className="text-xs text-muted-foreground">
                      {typeof inq.propertyId === "object" ? inq.propertyId?.title : "Property"}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{timeAgo(inq.createdAt)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Property Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {properties.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No properties yet.</p>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              properties.map((rawProp: any) => {
                const prop = transformProperty(rawProp);
                const coverImg = rawProp.images?.find((i: { isCover: boolean }) => i.isCover)?.url
                  || rawProp.images?.[0]?.url
                  || PLACEHOLDER_IMAGE;
                return (
                  <div key={rawProp._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={coverImg}
                        alt={prop.title}
                        className="h-10 w-10 rounded-md object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{prop.title}</p>
                        <p className="text-xs text-muted-foreground">
                          KES {prop.price.toLocaleString()}/mo
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap ml-2">
                      {rawProp.viewCount ?? 0} views
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
