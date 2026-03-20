import { Building2, Eye, MessageSquare, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockProperties } from "@/data/properties";

const stats = [
  { label: "Total Properties", value: mockProperties.length, icon: Building2, trend: "+2 this month" },
  { label: "Total Views", value: "2,847", icon: Eye, trend: "+12% vs last month" },
  { label: "Active Inquiries", value: 14, icon: MessageSquare, trend: "3 new today" },
  { label: "Occupancy Rate", value: "87%", icon: TrendingUp, trend: "+4% vs last month" },
];

export default function DashboardHome() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Welcome back, James
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
              <div className="text-2xl font-bold font-heading">{stat.value}</div>
              <p className="text-xs text-success mt-1">{stat.trend}</p>
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
            {[
              { name: "Sarah Wanjiku", property: "Modern 2BR in Kilimani", time: "2 hours ago" },
              { name: "Michael Otieno", property: "Cozy Studio in Westlands", time: "5 hours ago" },
              { name: "Grace Akinyi", property: "Elegant 1BR in Lavington", time: "1 day ago" },
            ].map((inquiry) => (
              <div key={inquiry.name} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{inquiry.name}</p>
                  <p className="text-xs text-muted-foreground">{inquiry.property}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{inquiry.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-heading">Property Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockProperties.slice(0, 3).map((prop) => (
              <div key={prop.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={prop.images[0]}
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
                <span className="text-xs font-medium text-success whitespace-nowrap ml-2">
                  {Math.floor(Math.random() * 80 + 120)} views
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
