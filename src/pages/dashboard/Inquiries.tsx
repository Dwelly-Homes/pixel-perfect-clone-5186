import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MessageSquare, Phone, Mail, Home, Clock, CheckCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  responded: "bg-green-100 text-green-800",
  viewing_request: "bg-purple-100 text-purple-800",
  closed: "bg-gray-100 text-gray-600",
};

const statusLabel: Record<string, string> = {
  new: "New",
  responded: "Responded",
  closed: "Closed",
};

const typeLabel: Record<string, string> = {
  general: "General Inquiry",
  viewing_request: "Viewing Request",
  booking_intent: "Booking Intent",
};

const tabs = ["All", "New", "Responded", "Closed"];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function Inquiries() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const { data } = await api.get("/inquiries?limit=100");
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/inquiries/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("Inquiry updated");
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const rawInquiries = data?.data || [];

  const filtered = rawInquiries.filter((i: { status: string; senderName: string; senderPhone: string; propertyId: { title: string } | null }) => {
    const matchTab = tab === "All" || i.status === tab.toLowerCase();
    const matchSearch =
      i.senderName?.toLowerCase().includes(search.toLowerCase()) ||
      i.senderPhone?.includes(search) ||
      (i.propertyId && typeof i.propertyId === "object" && (i.propertyId as { title: string }).title?.toLowerCase().includes(search.toLowerCase()));
    return matchTab && matchSearch;
  });

  const markResponded = (id: string) => {
    updateMutation.mutate({ id, status: "responded" });
    if (selected?._id === id) setSelected((s: { status: string } | null) => s ? { ...s, status: "responded" } : s);
  };

  const closeInquiry = (id: string) => {
    updateMutation.mutate({ id, status: "closed" });
    if (selected?._id === id) setSelected((s: { status: string } | null) => s ? { ...s, status: "closed" } : s);
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left panel */}
      <div className="w-full md:w-80 lg:w-96 border-r flex flex-col shrink-0">
        <div className="p-4 border-b space-y-3">
          <h1 className="text-lg font-heading font-bold">Inquiries</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search inquiries…" className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 flex-wrap">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn("px-2.5 py-1 rounded-full text-xs font-medium transition-colors", tab === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground")}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border-b animate-pulse">
                <div className="h-3 bg-muted rounded w-2/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No inquiries found.</div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filtered.map((inq: any) => (
              <button
                key={inq._id}
                onClick={() => setSelected(inq)}
                className={cn("w-full text-left p-4 border-b hover:bg-muted/30 transition-colors", selected?._id === inq._id && "bg-muted/50")}
              >
                <div className="flex items-start gap-2">
                  {inq.status === "new" && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                  {inq.status !== "new" && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-medium text-sm truncate">{inq.senderName}</span>
                      <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[inq.status] || statusColor.closed}`}>
                        {statusLabel[inq.status] || inq.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {typeof inq.propertyId === "object" ? inq.propertyId?.title : "Property"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{timeAgo(inq.createdAt)}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="hidden md:flex flex-1 flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center space-y-2">
              <MessageSquare className="h-10 w-10 mx-auto opacity-30" />
              <p>Select an inquiry to view details</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-heading font-bold">{selected.senderName}</h2>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{selected.senderPhone}</span>
                  {selected.senderEmail && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selected.senderEmail}</span>}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[selected.status] || statusColor.closed}`}>
                {statusLabel[selected.status] || selected.status}
              </span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg">
              <Home className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Property</p>
                <p className="text-sm font-medium">
                  {typeof selected.propertyId === "object" ? selected.propertyId?.title : "Property"}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto text-xs">
                {typeLabel[selected.inquiryType] || selected.inquiryType}
              </Badge>
            </div>

            {selected.requestedDate && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-sm">
                <Clock className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Requested viewing: <strong>{new Date(selected.requestedDate).toLocaleDateString("en-KE")}</strong> — {selected.requestedTimeSlot}</span>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Message</p>
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg leading-relaxed">{selected.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(selected.createdAt).toLocaleString("en-KE")}</p>
            </div>

            <div className="flex gap-3">
              {selected.status !== "responded" && selected.status !== "closed" && (
                <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => markResponded(selected._id)}>
                  <CheckCircle className="h-4 w-4 mr-1.5" />Mark as Responded
                </Button>
              )}
              {selected.status !== "closed" && (
                <Button size="sm" variant="outline" onClick={() => closeInquiry(selected._id)}>
                  <X className="h-4 w-4 mr-1.5" />Close Inquiry
                </Button>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-medium">Reply via SMS</p>
              <Textarea placeholder="Type your reply…" rows={3} disabled className="resize-none" />
              <Button size="sm" disabled className="opacity-60">
                Send Reply via SMS
                <Badge variant="outline" className="ml-2 text-[10px]">Coming Soon</Badge>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
