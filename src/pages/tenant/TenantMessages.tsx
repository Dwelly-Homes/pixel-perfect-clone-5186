import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Search, Mail, MapPin, Loader2, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import { format, isToday, isYesterday } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participant {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface ConversationSummary {
  _id: string;
  participants: Participant[];
  propertyId?: { _id: string; title: string } | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
}

interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: { _id: string; fullName: string };
  body: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatListTime(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, "HH:mm");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "d MMM");
}

function formatMsgTime(dateStr: string): string {
  return format(new Date(dateStr), "HH:mm");
}

function getOther(conv: ConversationSummary, myId: string): Participant | undefined {
  return conv.participants.find((p) => p._id !== myId);
}

function initials(name?: string): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TenantMessages() {
  const { user } = useAuth();
  const myId = user?.id ?? "";
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeConvId, setActiveConvId] = useState<string | null>(searchParams.get("conv"));
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [draft, setDraft] = useState("");
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Conversations ────────────────────────────────────────────────────────

  const { data: convsData, isLoading: convsLoading } = useQuery({
    queryKey: ["chatConversations"],
    queryFn: async () => {
      const { data } = await api.get("/chat");
      return data?.data as ConversationSummary[];
    },
    refetchInterval: 15000,
  });

  const conversations: ConversationSummary[] = convsData ?? [];
  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const other = getOther(c, myId);
    return (
      other?.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.propertyId?.title?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);
  const activeConv = conversations.find((c) => c._id === activeConvId);
  const activeOther = activeConv ? getOther(activeConv, myId) : undefined;

  // ─── Load messages ────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (convId: string, page = 1, prepend = false) => {
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/chat/${convId}/messages?page=${page}&limit=30`);
      const fetched: ChatMessage[] = data?.data ?? [];
      const meta = data?.meta;
      setHasMore(meta ? page < meta.totalPages : false);
      if (prepend) {
        setMessages((prev) => [...fetched, ...prev]);
      } else {
        setMessages(fetched);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  // ─── Open conversation ────────────────────────────────────────────────────

  const openConversation = useCallback((convId: string) => {
    const socket = getSocket();
    if (activeConvId && activeConvId !== convId) {
      socket.emit("conversation:leave", activeConvId);
    }
    setActiveConvId(convId);
    setSearchParams({ conv: convId });
    setMsgPage(1);
    setMessages([]);
    setHasMore(false);
    loadMessages(convId, 1);
    socket.emit("conversation:join", convId);
    socket.emit("messages:read", convId);
    setMobileShowChat(true);
    qc.setQueryData<ConversationSummary[]>(["chatConversations"], (old) =>
      old?.map((c) => (c._id === convId ? { ...c, unread: 0 } : c))
    );
  }, [activeConvId, loadMessages, qc, setSearchParams]);

  // Auto-open from URL param once conversations are loaded
  useEffect(() => {
    const convFromUrl = searchParams.get("conv");
    if (convFromUrl && convFromUrl !== activeConvId && conversations.length > 0) {
      openConversation(convFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  // ─── Socket events ────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();

    const onNewMessage = ({ message, conversationId }: { message: ChatMessage; conversationId: string }) => {
      if (conversationId === activeConvId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
        socket.emit("messages:read", conversationId);
      }
      qc.invalidateQueries({ queryKey: ["chatConversations"] });
    };

    const onTypingStart = ({ userId }: { userId: string }) => {
      if (userId !== myId) setTypingUserId(userId);
    };
    const onTypingStop = ({ userId }: { userId: string }) => {
      if (userId !== myId) setTypingUserId(null);
    };
    const onConvUpdated = () => {
      qc.invalidateQueries({ queryKey: ["chatConversations"] });
    };

    socket.on("message:new", onNewMessage);
    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);
    socket.on("conversation:updated", onConvUpdated);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
      socket.off("conversation:updated", onConvUpdated);
    };
  }, [activeConvId, myId, qc]);

  // ─── Send message ─────────────────────────────────────────────────────────

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !activeConvId) return;
    setDraft("");
    const socket = getSocket();
    if (socket.connected) {
      socket.emit("message:send", { conversationId: activeConvId, body });
    } else {
      // REST fallback
      api.post(`/chat/${activeConvId}/messages`, { body }).then(({ data }) => {
        setMessages((prev) => [...prev, data.data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      });
    }
    socket.emit("typing:stop", activeConvId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setIsTyping(false);
  };

  // ─── Typing indicator ─────────────────────────────────────────────────────

  const handleDraftChange = (val: string) => {
    setDraft(val);
    if (!activeConvId) return;
    const socket = getSocket();
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing:start", activeConvId);
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit("typing:stop", activeConvId);
    }, 2000);
  };

  // ─── Load more ────────────────────────────────────────────────────────────

  const loadMore = () => {
    if (!activeConvId || loadingMsgs) return;
    const next = msgPage + 1;
    setMsgPage(next);
    loadMessages(activeConvId, next, true);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold">Messages</h1>
          {totalUnread > 0 && (
            <Badge className="bg-destructive text-destructive-foreground">{totalUnread}</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Chat with agents and landlords about properties.</p>
      </div>

      <div className="flex gap-0 border rounded-xl overflow-hidden h-[620px]">

        {/* ─── Conversation list ──────────────────────────────────────── */}
        <div className={cn(
          "w-72 shrink-0 border-r flex flex-col",
          mobileShowChat && "hidden sm:flex"
        )}>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {convsLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs gap-2 p-4 text-center">
                <MessageSquare className="h-8 w-8 opacity-30" />
                No conversations yet.
                <span className="text-[11px]">Start a chat from a property listing.</span>
              </div>
            ) : (
              <div className="divide-y">
                {filtered.map((conv) => {
                  const other = getOther(conv, myId);
                  const isActive = conv._id === activeConvId;
                  return (
                    <button
                      key={conv._id}
                      onClick={() => openConversation(conv._id)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 text-left hover:bg-muted/40 transition-colors",
                        isActive && "bg-muted/60"
                      )}
                    >
                      <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                        {initials(other?.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{other?.fullName ?? "Unknown"}</p>
                          {conv.lastMessageAt && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-1">
                              {formatListTime(conv.lastMessageAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage ?? "No messages yet"}
                        </p>
                        {conv.propertyId?.title && (
                          <p className="text-[10px] text-secondary truncate">{conv.propertyId.title}</p>
                        )}
                      </div>
                      {conv.unread > 0 && (
                        <span className="h-5 w-5 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center shrink-0 mt-0.5">
                          {conv.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* ─── Chat pane ─────────────────────────────────────────────── */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0",
          !mobileShowChat && "hidden sm:flex"
        )}>
          {!activeConvId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="h-12 w-12 opacity-20" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs text-center px-8">
                Pick a chat from the list, or start a new one from a property page.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden h-8 w-8 shrink-0"
                    onClick={() => setMobileShowChat(false)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(activeOther?.fullName)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{activeOther?.fullName ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <span className="capitalize">{activeOther?.role?.replace(/_/g, " ")}</span>
                      {activeConv?.propertyId?.title && (
                        <>
                          <span>·</span>
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          <span className="truncate">{activeConv.propertyId.title}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                {activeOther?.email && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
                    <a href={`mailto:${activeOther.email}`} title={activeOther.email}>
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {hasMore && (
                  <div className="flex justify-center mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={loadMore}
                      disabled={loadingMsgs}
                    >
                      {loadingMsgs
                        ? <Loader2 className="h-3 w-3 animate-spin" />
                        : "Load earlier messages"
                      }
                    </Button>
                  </div>
                )}

                {loadingMsgs && messages.length === 0 ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-xs text-muted-foreground gap-1">
                    <MessageSquare className="h-8 w-8 opacity-20 mb-1" />
                    No messages yet — say hello!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeConv?.propertyId?.title && (
                      <p className="text-center text-xs text-muted-foreground py-1">
                        Re: {activeConv.propertyId.title}
                      </p>
                    )}
                    {messages.map((msg, idx) => {
                      const isMe = msg.senderId._id === myId;
                      const showAvatar = !isMe && (
                        idx === messages.length - 1 ||
                        messages[idx + 1]?.senderId._id !== msg.senderId._id
                      );
                      return (
                        <div
                          key={msg._id}
                          className={cn("flex items-end gap-2", isMe ? "justify-end" : "justify-start")}
                        >
                          {/* Other person's avatar */}
                          {!isMe && (
                            <div className={cn(
                              "h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0",
                              !showAvatar && "invisible"
                            )}>
                              {initials(msg.senderId.fullName)}
                            </div>
                          )}

                          <div className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2.5",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted rounded-bl-sm"
                          )}>
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                            <p className={cn(
                              "text-[10px] mt-1",
                              isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                            )}>
                              {formatMsgTime(msg.createdAt)}
                              {isMe && (
                                <span className="ml-1">{msg.isRead ? "✓✓" : "✓"}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    {typingUserId && typingUserId !== myId && (
                      <div className="flex items-end gap-2 justify-start">
                        <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                          {initials(activeOther?.fullName)}
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}

                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t flex gap-2 shrink-0">
                <Input
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => handleDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  className="flex-1 text-sm"
                  autoComplete="off"
                />
                <Button
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="bg-secondary hover:bg-secondary/90 shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
