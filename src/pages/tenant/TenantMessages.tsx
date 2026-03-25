import { useState, useRef, useEffect } from "react";
import { Send, Search, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  from: "me" | "agent";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  agent: string;
  agency: string;
  property: string;
  initials: string;
  color: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: Message[];
}

const CONVERSATIONS: Conversation[] = [
  {
    id: "1", agent: "James Mwangi", agency: "Prestige Properties", property: "Modern 2BR Apartment, Kilimani",
    initials: "JM", color: "bg-primary",
    lastMessage: "Yes, it's available! Let's schedule a viewing.", lastTime: "2024-06-20T14:30:00", unread: 1,
    messages: [
      { id: "1", from: "me", text: "Hi James, is the 2BR apartment in Kilimani still available?", time: "2024-06-20T10:00:00" },
      { id: "2", from: "agent", text: "Yes, it's available! Let's schedule a viewing.", time: "2024-06-20T14:30:00" },
    ],
  },
  {
    id: "2", agent: "Sarah Odhiambo", agency: "KeyHomes Agency", property: "Spacious Studio, Westlands",
    initials: "SO", color: "bg-secondary",
    lastMessage: "Can you make it on Saturday morning?", lastTime: "2024-06-19T09:15:00", unread: 1,
    messages: [
      { id: "1", from: "me", text: "I'd like to book a viewing for the studio in Westlands.", time: "2024-06-18T16:00:00" },
      { id: "2", from: "agent", text: "Great! When would you be available?", time: "2024-06-18T17:30:00" },
      { id: "3", from: "me", text: "I'm free any morning next week.", time: "2024-06-19T08:00:00" },
      { id: "4", from: "agent", text: "Can you make it on Saturday morning?", time: "2024-06-19T09:15:00" },
    ],
  },
  {
    id: "3", agent: "David Otieno", agency: "Nairobi Realty Ltd", property: "2BR Family Home, Runda",
    initials: "DO", color: "bg-green-600",
    lastMessage: "Water and garbage are included. Electricity is separate.", lastTime: "2024-06-15T11:00:00", unread: 0,
    messages: [
      { id: "1", from: "me", text: "What utilities are included in the rent for the Runda property?", time: "2024-06-15T10:00:00" },
      { id: "2", from: "agent", text: "Water and garbage are included. Electricity is separate.", time: "2024-06-15T11:00:00" },
    ],
  },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export default function TenantMessages() {
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const [selected, setSelected] = useState<Conversation>(CONVERSATIONS[0]);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected.messages]);

  function selectConv(conv: Conversation) {
    // Mark as read
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread: 0 } : c));
    setSelected({ ...conv, unread: 0 });
  }

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg: Message = { id: Date.now().toString(), from: "me", text: input, time: new Date().toISOString() };
    const updated = { ...selected, messages: [...selected.messages, newMsg], lastMessage: input, lastTime: newMsg.time };
    setSelected(updated);
    setConversations((prev) => prev.map((c) => c.id === selected.id ? updated : c));
    setInput("");
  }

  const filtered = conversations.filter((c) =>
    !search || c.agent.toLowerCase().includes(search.toLowerCase()) || c.property.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold">Messages</h1>
          {totalUnread > 0 && <Badge className="bg-destructive text-destructive-foreground">{totalUnread}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Chat with agents about properties.</p>
      </div>

      <div className="flex gap-0 border rounded-xl overflow-hidden h-[600px]">
        {/* Sidebar */}
        <div className="w-72 shrink-0 border-r flex flex-col">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search conversations…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConv(conv)}
                className={cn("w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40 transition-colors",
                  selected.id === conv.id && "bg-muted/60"
                )}
              >
                <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", conv.color)}>
                  {conv.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{conv.agent}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">{timeAgo(conv.lastTime)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="h-5 w-5 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center shrink-0">{conv.unread}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={cn("h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", selected.color)}>
                {selected.initials}
              </div>
              <div>
                <p className="font-semibold text-sm">{selected.agent}</p>
                <p className="text-xs text-muted-foreground">{selected.agency} · <span className="flex items-center gap-0.5 inline-flex"><MapPin className="h-2.5 w-2.5" />{selected.property}</span></p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="tel:+254712345678"><Phone className="h-4 w-4" /></a>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <a href="mailto:agent@prestige.co.ke"><Mail className="h-4 w-4" /></a>
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <p className="text-center text-xs text-muted-foreground py-2">Re: {selected.property}</p>
            {selected.messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.from === "me" ? "justify-end" : "justify-start")}>
                {msg.from === "agent" && (
                  <div className={cn("h-6 w-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mr-2 mt-1", selected.color)}>
                    {selected.initials[0]}
                  </div>
                )}
                <div className={cn("max-w-[70%] rounded-2xl px-4 py-2.5",
                  msg.from === "me" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm"
                )}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <p className={cn("text-[10px] mt-1", msg.from === "me" ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>
                    {formatTime(msg.time)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t flex gap-2">
            <Input
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              className="flex-1 text-sm"
            />
            <Button onClick={sendMessage} disabled={!input.trim()} className="bg-secondary hover:bg-secondary/90 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
