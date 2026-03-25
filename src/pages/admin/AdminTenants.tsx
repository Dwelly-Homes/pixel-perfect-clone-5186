import { useState } from "react";
import { Search, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TABS = ["All", "Active", "Inactive", "Flagged"] as const;

export default function AdminTenants() {
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  // NOTE: Tenant (apartment renter) tracking requires additional backend support.
  // Currently, searcher/renter accounts are stored as User records (role: "searcher")
  // but there's no platform-admin endpoint to list them yet.

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-heading font-bold">Tenants</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage all platform tenants.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        <div className="relative ml-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search tenants…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-64" />
        </div>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center gap-4">
          <Users className="h-10 w-10 text-muted-foreground opacity-40" />
          <div>
            <p className="font-medium text-sm">Tenant management coming soon</p>
            <p className="text-xs text-muted-foreground mt-1">
              This section will display apartment renters registered on the platform.
              Individual tenant tracking is being developed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
