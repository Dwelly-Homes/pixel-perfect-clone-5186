import { useState } from "react";
import { Calendar, List, CheckCircle, X, Clock, Phone, Home, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const mockViewings = [
  { id: "1", date: "2024-06-24", slot: "Morning (8am-12pm)", tenant: "Sarah Wanjiku", phone: "0712 345 678", property: "Modern 2BR in Kilimani", status: "Pending" },
  { id: "2", date: "2024-06-24", slot: "Afternoon (12pm-5pm)", tenant: "Michael Otieno", phone: "0723 456 789", property: "Cozy Studio in Westlands", status: "Confirmed" },
  { id: "3", date: "2024-06-25", slot: "Morning (8am-12pm)", tenant: "Grace Akinyi", phone: "0734 567 890", property: "Elegant 1BR in Lavington", status: "Pending" },
  { id: "4", date: "2024-06-26", slot: "Evening (5pm-7pm)", tenant: "Peter Kamau", phone: "0745 678 901", property: "Spacious 3BR in Karen", status: "Confirmed" },
  { id: "5", date: "2024-06-28", slot: "Afternoon (12pm-5pm)", tenant: "Joyce Muthoni", phone: "0756 789 012", property: "Modern 2BR in Kilimani", status: "Completed" },
  { id: "6", date: "2024-06-20", slot: "Morning (8am-12pm)", tenant: "David Njoroge", phone: "0767 890 123", property: "Cozy Studio in Westlands", status: "Cancelled" },
];

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
  const { toast } = useToast();
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [filter, setFilter] = useState("All");
  const [viewings, setViewings] = useState(mockViewings);
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());

  const upcoming = viewings.filter(v => new Date(v.date) >= new Date(today.toDateString()));
  const thisWeekUpcoming = upcoming.filter(v => {
    const d = new Date(v.date);
    const diff = (d.getTime() - today.getTime()) / 86400000;
    return diff <= 7;
  });

  const filtered = viewings.filter((v) => {
    const d = new Date(v.date);
    const past = d < new Date(today.toDateString());
    if (filter === "Upcoming") return !past;
    if (filter === "Past") return past;
    return true;
  });

  function confirm(id: string) {
    setViewings((p) => p.map((v) => v.id === id ? { ...v, status: "Confirmed" } : v));
    toast({ title: "Viewing confirmed" });
  }

  function cancel(id: string) {
    setViewings((p) => p.map((v) => v.id === id ? { ...v, status: "Cancelled" } : v));
    toast({ title: "Viewing cancelled" });
  }

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDay(calYear, calMonth);
  const monthName = new Date(calYear, calMonth, 1).toLocaleString("en-KE", { month: "long", year: "numeric" });

  function viewingsOnDay(day: number) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return viewings.filter((v) => v.date === dateStr);
  }

  const selectedDayViewings = selectedDay ? viewingsOnDay(selectedDay) : [];

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
          {/* Calendar */}
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

          {/* Day panel */}
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
                    {selectedDayViewings.map((v) => (
                      <div key={v.id} className="p-3 bg-muted/40 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{v.tenant}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusColor[v.status]}`}>{v.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{v.slot}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Home className="h-3 w-3" />{v.property}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{v.phone}</p>
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
                  {filtered.map((v) => (
                    <tr key={v.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(v.date).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{v.slot}</td>
                      <td className="px-4 py-3 font-medium whitespace-nowrap">{v.tenant}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{v.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{v.property}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor[v.status]}`}>{v.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {v.status === "Pending" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => confirm(v.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />Confirm
                            </Button>
                          )}
                          {(v.status === "Pending" || v.status === "Confirmed") && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => cancel(v.id)}>
                              <X className="h-3 w-3 mr-1" />Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
