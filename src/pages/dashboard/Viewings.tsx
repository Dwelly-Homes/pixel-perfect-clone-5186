import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, List, CheckCircle, X, Clock, Phone, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { api, getApiError } from "@/lib/api";

// Backend inquiry statuses map to viewing statuses
const statusToDisplay: Record<string, string> = {
  new: "Pending",
  responded: "Confirmed",
  closed: "Completed",
};

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-gray-100 text-gray-500",
};

const filterTabs = ["Upcoming", "Past", "All"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Viewings() {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [filter, setFilter] = useState("All");
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const { data, isLoading } = useQuery({
    queryKey: ["viewings"],
    queryFn: async () => {
      const { data } = await api.get("/inquiries?limit=100");
      // Filter only viewing_request type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const all = data?.data || [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return all.filter((i: any) => i.inquiryType === "viewing_request");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/inquiries/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viewings"] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawViewings: any[] = data || [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getDisplayStatus(v: any): string {
    // If status is closed, check if it was previously confirmed (responded) - treat as Completed
    // Otherwise, use the mapping
    return statusToDisplay[v.status] || v.status;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function getDateStr(v: any): string {
    return v.requestedDate ? new Date(v.requestedDate).toISOString().split("T")[0] : "";
  }

  const upcoming = rawViewings.filter((v) => {
    const d = getDateStr(v);
    return d && new Date(d) >= new Date(today.toDateString());
  });

  const thisWeekUpcoming = upcoming.filter((v) => {
    const d = new Date(getDateStr(v));
    const diff = (d.getTime() - today.getTime()) / 86400000;
    return diff <= 7;
  });

  const filtered = rawViewings.filter((v) => {
    const d = getDateStr(v);
    if (!d) return filter === "All";
    const past = new Date(d) < new Date(today.toDateString());
    if (filter === "Upcoming") return !past;
    if (filter === "Past") return past;
    return true;
  });

  function confirmViewing(id: string) {
    updateMutation.mutate({ id, status: "responded" });
    toast.success("Viewing confirmed");
  }

  function cancelViewing(id: string) {
    updateMutation.mutate({ id, status: "closed" });
    toast.success("Viewing cancelled");
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDay(calYear, calMonth);
  const monthName = new Date(calYear, calMonth, 1).toLocaleString("en-KE", { month: "long", year: "numeric" });

  function viewingsOnDay(day: number) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return rawViewings.filter((v) => getDateStr(v) === dateStr);
  }

  const selectedDayViewings = selectedDay ? viewingsOnDay(selectedDay) : [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-8 bg-muted rounded w-48 mb-2 animate-pulse" />
        <div className="h-4 bg-muted rounded w-32 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-heading font-bold">Property Viewings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {thisWeekUpcoming.length} upcoming viewing{thisWeekUpcoming.length !== 1 ? "s" : ""} this week
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={mode === "calendar" ? "default" : "outline"} size="sm" onClick={() => setMode("calendar")}>
            <Calendar className="h-4 w-4 mr-1.5" />Calendar
          </Button>
          <Button variant={mode === "list" ? "default" : "outline"} size="sm" onClick={() => setMode("list")}>
            <List className="h-4 w-4 mr-1.5" />List
          </Button>
        </div>
      </div>

      {mode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{monthName}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1);
                    }}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1);
                    }}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 text-center mb-2">
                  {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                    <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dayViewings = viewingsOnDay(day);
                    const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
                    const isSelected = day === selectedDay;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={cn(
                          "relative flex flex-col items-center justify-center h-10 rounded-lg text-sm transition-colors",
                          isSelected && "bg-primary text-primary-foreground",
                          isToday && !isSelected && "ring-2 ring-primary/40",
                          !isSelected && "hover:bg-muted"
                        )}
                      >
                        {day}
                        {dayViewings.length > 0 && (
                          <span className={cn("absolute bottom-1 h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : "bg-secondary")} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-sm">
                  {selectedDay
                    ? new Date(calYear, calMonth, selectedDay).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })
                    : "Select a day"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDayViewings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No viewings on this day.</p>
                ) : (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {selectedDayViewings.map((v: any) => (
                      <div key={v._id} className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{v.senderName}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[getDisplayStatus(v)] || ""}`}>{getDisplayStatus(v)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{v.requestedTimeSlot || "—"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Home className="h-3 w-3" />{typeof v.propertyId === "object" ? v.propertyId?.title : "—"}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{v.senderPhone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex gap-2">
              {filterTabs.map((t) => (
                <button key={t} onClick={() => setFilter(t)}
                  className={cn("px-3 py-1.5 rounded-full text-xs font-medium transition-colors", filter === t ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground")}>
                  {t}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    {["Date","Time Slot","Tenant","Phone","Property","Status","Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {filtered.map((v: any) => {
                    const displayStatus = getDisplayStatus(v);
                    const dateStr = getDateStr(v);
                    return (
                      <tr key={v._id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          {dateStr ? new Date(dateStr).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{v.requestedTimeSlot || "—"}</td>
                        <td className="px-4 py-3 font-medium whitespace-nowrap">{v.senderName}</td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{v.senderPhone}</td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">
                          {typeof v.propertyId === "object" ? v.propertyId?.title : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[displayStatus] || ""}`}>{displayStatus}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {v.status === "new" && (
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => confirmViewing(v._id)}>
                                <CheckCircle className="h-3 w-3 mr-1" />Confirm
                              </Button>
                            )}
                            {(v.status === "new" || v.status === "responded") && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => cancelViewing(v._id)}>
                                <X className="h-3 w-3 mr-1" />Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground">No viewings found.</p>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
