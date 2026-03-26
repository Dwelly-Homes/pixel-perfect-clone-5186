import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, MessageSquare, Search, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface Message {
  _id: string;
  conversationId: string;
  senderId: { _id: string; fullName: string };
  body: string;
  isRead: boolean;
  createdAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
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

export default function Chat() {
  const { user } = useAuth();
  const myId = user?.id ?? "";
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeConvId, setActiveConvId] = useState<string | null>(
    searchParams.get("conv")
  );
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgPage, setMsgPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // ─── Conversations list ───────────────────────────────────────────────────

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
    return other?.fullName.toLowerCase().includes(search.toLowerCase()) ||
           c.propertyId?.title?.toLowerCase().includes(search.toLowerCase());
  });

  // ─── Load messages for active conversation ────────────────────────────────

  const loadMessages = useCallback(async (convId: string, page = 1, prepend = false) => {
    setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/chat/${convId}/messages?page=${page}&limit=30`);
      const fetched: Message[] = data?.data ?? [];
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

    // Leave previous room
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

    // Update unread to 0 in local cache
    qc.setQueryData<ConversationSummary[]>(["chatConversations"], (old) =>
      old?.map((c) => (c._id === convId ? { ...c, unread: 0 } : c))
    );
  }, [activeConvId, loadMessages, qc, setSearchParams]);

  // Auto-open conversation from URL param
  useEffect(() => {
    const convFromUrl = searchParams.get("conv");
    if (convFromUrl && convFromUrl !== activeConvId && conversations.length > 0) {
      openConversation(convFromUrl);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations.length]);

  // ─── Socket.IO real-time events ──────────────────────────────────────────

  useEffect(() => {
    const socket = getSocket();

    const onNewMessage = ({ message, conversationId }: { message: Message; conversationId: string }) => {
      if (conversationId === activeConvId) {
        setMessages((prev) => [...prev, message]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
        socket.emit("messages:read", conversationId);
      }
      // Refresh conversation list for unread counts / last message
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

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      // Prefer socket; REST is backup
      const socket = getSocket();
      if (socket.connected) {
        socket.emit("message:send", { conversationId: activeConvId, body });
      } else {
        const { data } = await api.post(`/chat/${activeConvId}/messages`, { body });
        setMessages((prev) => [...prev, data.data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
      }
    },
  });

  const handleSend = () => {
    const body = draft.trim();
    if (!body || !activeConvId) return;
    setDraft("");
    sendMutation.mutate(body);
    // Stop typing indicator
    getSocket().emit("typing:stop", activeConvId);
    if (typingTimer.current) clearTimeout(typingTimer.current);
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

  // ─── Load more (older messages) ──────────────────────────────────────────

  const loadMore = () => {
    if (!activeConvId || loadingMsgs) return;
    const next = msgPage + 1;
    setMsgPage(next);
    loadMessages(activeConvId, next, true);
  };

  // ─── Derived ─────────────────────────────────────────────────────────────

  const activeConv = conversations.find((c) => c._id === activeConvId);
  const activeOther = activeConv ? getOther(activeConv, myId) : undefined;
  const totalUnread = conversations.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ─── Conversation List ───────────────────────────────────────────── */}
      <div className={cn(
        "w-full sm:w-80 shrink-0 flex flex-col border-r bg-card",
        mobileShowChat && "hidden sm:flex"
      )}>
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-semibold text-sm">Messages</h1>
            {totalUnread > 0 && (
              <span className="h-5 min-w-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b">
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

        {/* List */}
        <ScrollArea className="flex-1">
          {convsLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs gap-2">
              <MessageSquare className="h-8 w-8 opacity-30" />
              No conversations yet
            </div>
          ) : (
            filtered.map((conv) => {
              const other = getOther(conv, myId);
              const isActive = conv._id === activeConvId;
              return (
                <button
                  key={conv._id}
                  onClick={() => openConversation(conv._id)}
                  className={cn(
                    "w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-muted/40 transition-colors text-left",
                    isActive && "bg-secondary/10"
                  )}
                >
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(other?.fullName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold truncate">{other?.fullName ?? "Unknown"}</span>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {conv.propertyId?.title && (
                        <span className="text-secondary font-medium">{conv.propertyId.title} · </span>
                      )}
                      {conv.lastMessage ?? "No messages yet"}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="h-4 min-w-4 px-1 rounded-full bg-secondary text-secondary-foreground text-[9px] font-bold flex items-center justify-center shrink-0 mt-1">
                      {conv.unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* ─── Chat Pane ───────────────────────────────────────────────────── */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        !mobileShowChat && "hidden sm:flex"
      )}>
        {!activeConvId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageSquare className="h-14 w-14 opacity-20" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs">Choose a conversation from the left to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="h-14 shrink-0 border-b flex items-center gap-3 px-4 bg-card">
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden h-8 w-8"
                onClick={() => setMobileShowChat(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                {initials(activeOther?.fullName)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{activeOther?.fullName ?? "Unknown"}</p>
                {activeConv?.propertyId?.title && (
                  <p className="text-[10px] text-muted-foreground truncate">{activeConv.propertyId.title}</p>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              {hasMore && (
                <div className="flex justify-center mb-3">
                  <Button variant="ghost" size="sm" className="text-xs" onClick={loadMore} disabled={loadingMsgs}>
                    {loadingMsgs ? <Loader2 className="h-3 w-3 animate-spin" /> : "Load earlier messages"}
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
                <div className="space-y-1.5">
                  {messages.map((msg, idx) => {
                    const isMe = msg.senderId._id === myId;
                    const showName = !isMe && (idx === 0 || messages[idx - 1]?.senderId._id !== msg.senderId._id);
                    return (
                      <div key={msg._id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                        {showName && (
                          <span className="text-[10px] text-muted-foreground mb-0.5 ml-1">
                            {msg.senderId.fullName}
                          </span>
                        )}
                        <div className={cn(
                          "max-w-[70%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                          isMe
                            ? "bg-secondary text-secondary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        )}>
                          {msg.body}
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-0.5 mx-1">
                          {formatMsgTime(msg.createdAt)}
                          {isMe && (
                            <span className="ml-1">{msg.isRead ? "✓✓" : "✓"}</span>
                          )}
                        </span>
                      </div>
                    );
                  })}

                  {/* Typing indicator */}
                  {typingUserId && typingUserId !== myId && (
                    <div className="flex items-start">
                      <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-sm flex items-center gap-1">
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
            <div className="shrink-0 border-t px-4 py-3 bg-card">
              <form
                className="flex items-end gap-2"
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              >
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
                  type="submit"
                  size="icon"
                  disabled={!draft.trim()}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
