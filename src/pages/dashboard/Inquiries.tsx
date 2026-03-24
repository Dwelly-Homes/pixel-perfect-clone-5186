import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageSquare, Phone, Mail, Home, Clock, CheckCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const mockInquiries = [
  { id: "1", name: "Sarah Wanjiku", phone: "0712 345 678", email: "sarah@email.com", property: "Modern 2BR in Kilimani", message: "Hello, I am interested in this property. Could you please share more details about the lease terms and whether utilities are included in the rent?", time: "2024-06-20T09:30:00", status: "New", type: "General Inquiry" },
  { id: "2", name: "Michael Otieno", phone: "0723 456 789", email: "michael@email.com", property: "Cozy Studio in Westlands", message: "I would like to schedule a viewing for this weekend if possible. Please let me know your availability.", time: "2024-06-20T07:15:00", status: "Viewing Requested", type: "Viewing Request" },
  { id: "3", name: "Grace Akinyi", phone: "0734 567 890", email: "", property: "Elegant 1BR in Lavington", message: "Is this property still available? I am looking for a place to move in immediately.", time: "2024-06-19T16:00:00", status: "Responded", type: "General Inquiry" },
  { id: "4", name: "Peter Kamau", phone: "0745 678 901", email: "peter@email.com", property: "Spacious 3BR in Karen", message: "Hi, I saw your listing and I am very interested. Can we arrange a call to discuss further?", time: "2024-06-19T11:30:00", status: "Closed", type: "General Inquiry" },
  { id: "5", name: "Joyce Muthoni", phone: "0756 789 012", email: "joyce@email.com", property: "Modern 2BR in Kilimani", message: "I need a 2-bedroom apartment for a family of 4. Does this property allow children and small pets?", time: "2024-06-18T14:45:00", status: "New", type: "General Inquiry" },
];

const statusColor: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Responded: "bg-green-100 text-green-800",
  "Viewing Requested": "bg-purple-100 text-purple-800",
  Closed: "bg-gray-100 text-gray-600",
};

const tabs = ["All", "New", "Responded", "Viewing Requested", "Closed"];

function maskPhone(phone: string) {
  return phone.slice(0, 4) + " XXX " + phone.slice(-3);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}

export default function Inquiries() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState<typeof mockInquiries[0] | null>(mockInquiries[0]);
  const [inquiries, setInquiries] = useState(mockInquiries);

  const filtered = inquiries.filter((i) => {
    const matchTab = tab === "All" || i.status === tab;
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.phone.includes(search) || i.property.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  function markResponded(id: string) {
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status: "Responded" } : i));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: "Responded" } : s);
    toast({ title: "Marked as responded" });
  }

  function closeInquiry(id: string) {
    setInquiries((prev) => prev.map((i) => i.id === id ? { ...i, status: "Closed" } : i));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: "Closed" } : s);
    toast({ title: "Inquiry closed" });
  }

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
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No inquiries found.</div>
          ) : (
            filtered.map((inq) => (
              <button
                key={inq.id}
                onClick={() => setSelected(inq)}
                className={cn("w-full text-left p-4 border-b hover:bg-muted/30 transition-colors", selected?.id === inq.id && "bg-muted/50")}
              >
                <div className="flex items-start gap-2">
                  {inq.status === "New" && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                  {inq.status !== "New" && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-medium text-sm truncate">{inq.name}</span>
                      <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[inq.status]}`}>{inq.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{inq.property}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{timeAgo(inq.time)}
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
                <h2 className="text-xl font-heading font-bold">{selected.name}</h2>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{maskPhone(selected.phone)}</span>
                  {selected.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selected.email}</span>}
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor[selected.status]}`}>{selected.status}</span>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-lg">
              <Home className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Property</p>
                <p className="text-sm font-medium">{selected.property}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-xs">{selected.type}</Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Message</p>
              <p className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg leading-relaxed">{selected.message}</p>
              <p className="text-xs text-muted-foreground">{new Date(selected.time).toLocaleString("en-KE")}</p>
            </div>

            <div className="flex gap-3">
              {selected.status !== "Responded" && selected.status !== "Closed" && (
                <Button size="sm" className="bg-secondary hover:bg-secondary/90" onClick={() => markResponded(selected.id)}>
                  <CheckCircle className="h-4 w-4 mr-1.5" />Mark as Responded
                </Button>
              )}
              {selected.status !== "Closed" && (
                <Button size="sm" variant="outline" onClick={() => closeInquiry(selected.id)}>
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
