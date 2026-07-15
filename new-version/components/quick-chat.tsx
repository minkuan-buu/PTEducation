"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  Card,
  Avatar,
  Input,
  Button,
  ScrollShadow,
  Spinner,
  Chip,
  Modal,
} from "@heroui/react";
import { toast } from "@heroui/react";
import {
  TbSend,
  TbMessage,
  TbSearch,
  TbBrandHipchat,
  TbUsers,
  TbX,
} from "react-icons/tb";
import { AnimatePresence, motion } from "framer-motion";

import { useUser } from "@/context/user-context";
import { useChatRealtime } from "@/context/chat-context";
import typingStyles from "@/app/(main)/chat/typing-indicator.module.css";
import {
  getChatMessages,
  sendMessage,
  markAsRead,
  getSupportContacts,
  getOrCreatePrivateChat,
  type ChatMessageResModel,
  type ChatContactResModel,
} from "@/services/api/v2/chat";

function formatMessageTime(timestamp: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const timeStr = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (date >= today) {
    return timeStr;
  } else if (date >= yesterday) {
    return `Hôm qua, ${timeStr}`;
  } else {
    const dateStr = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${dateStr}, ${timeStr}`;
  }
}

function isDifferentDay(t1: number, t2: number) {
  if (!t1 || !t2) return false;
  const d1 = new Date(t1 * 1000);
  const d2 = new Date(t2 * 1000);
  return (
    d1.getDate() !== d2.getDate() ||
    d1.getMonth() !== d2.getMonth() ||
    d1.getFullYear() !== d2.getFullYear()
  );
}

function formatDividerDate(timestamp: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) {
    return "Hôm nay";
  } else if (date >= yesterday) {
    return "Hôm qua";
  } else {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
}

function formatRoomDate(timestamp: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getRoleBadge(role: string) {
  const r = role.toLowerCase();
  if (r === "admin") return { label: "Admin", color: "danger" as const };
  if (r === "manager") return { label: "Quản lý", color: "warning" as const };
  if (r === "guardian") return { label: "Phụ huynh", color: "success" as const };
  return { label: "Học sinh", color: "accent" as const };
}

export function QuickChat() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useUser();

  const {
    chats,
    connectionStatus,
    activeChatId,
    setActiveChatId,
    refetchChats,
    typingUsers,
    sendTypingIndicator,
    totalUnreadCount,
  } = useChatRealtime();

  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [inputText, setInputText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [isContactsOpen, setIsContactsOpen] = React.useState(false);
  const [isCreatingChat, setIsCreatingChat] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-hide on /chat route
  const isChatRoute = pathname === "/chat" || pathname?.startsWith("/chat/");

  // Listen to profile private chat triggers
  React.useEffect(() => {
    const handleTriggerChat = async (e: Event) => {
      const customEvent = e as CustomEvent<{ targetUserId: string }>;
      const targetUserId = customEvent.detail?.targetUserId;
      if (!targetUserId) return;

      setIsOpen(true);
      setIsContactsOpen(false);
      setIsCreatingChat(true);

      try {
        const newChatId = await getOrCreatePrivateChat(targetUserId);
        if (newChatId) {
          await refetchChats();
          setActiveChatId(newChatId);
        } else {
          toast.danger("Không thể tạo phòng chat riêng.");
        }
      } catch (err) {
        console.error(err);
        toast.danger("Có lỗi xảy ra khi bắt đầu cuộc trò chuyện.");
      } finally {
        setIsCreatingChat(false);
      }
    };

    window.addEventListener("trigger-quick-chat", handleTriggerChat);
    return () => {
      window.removeEventListener("trigger-quick-chat", handleTriggerChat);
    };
  }, [setActiveChatId, refetchChats]);

  // Fetch support contacts (only if student or guardian)
  const isStudentOrGuardian =
    user && (user.role?.toLowerCase() === "student" || user.role?.toLowerCase() === "guardian");

  const {
    data: contacts = [],
    isLoading: isContactsLoading,
    refetch: refetchContacts,
  } = useQuery<ChatContactResModel[]>({
    queryKey: ["quick-support-contacts"],
    queryFn: getSupportContacts,
    enabled: !!user && isOpen && isStudentOrGuardian,
  });

  // Fetch messages of active room
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["chat-messages", activeChatId],
    queryFn: ({ pageParam = 1 }) => getChatMessages(activeChatId!, pageParam, 50),
    getNextPageParam: (lastPage) => {
      if (lastPage.pageNumber < lastPage.totalPages) {
        return lastPage.pageNumber + 1;
      }
      return undefined;
    },
    enabled: !!activeChatId && isOpen,
    initialPageParam: 1,
    staleTime: Infinity, // messages are driven entirely by SignalR invalidation
  });

  const messages = React.useMemo(() => {
    if (!messagesData) return [];
    return [...messagesData.pages]
      .reverse()
      .flatMap((page) => page.data || [])
      .filter(Boolean);
  }, [messagesData]);

  const activeRoom = React.useMemo(() => {
    return chats.find((r) => r.chatId === activeChatId) || null;
  }, [chats, activeChatId]);

  const newestMessageIdRef = React.useRef<string | null>(null);
  const [isInitialScrollDone, setIsInitialScrollDone] = React.useState(false);

  React.useEffect(() => {
    setIsInitialScrollDone(false);
    newestMessageIdRef.current = null;
  }, [activeChatId]);

  // Scroll to bottom when messages update
  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setTimeout(() => setIsInitialScrollDone(true), 100);
  }, []);

  React.useEffect(() => {
    if (messages.length > 0 && isOpen) {
      const newestMessageId = messages[messages.length - 1].id;
      if (newestMessageId !== newestMessageIdRef.current) {
        const isFirstLoad = newestMessageIdRef.current === null;
        newestMessageIdRef.current = newestMessageId;
        const timer = setTimeout(() => scrollToBottom(isFirstLoad ? "instant" : "smooth"), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, scrollToBottom, isOpen]);

  // Scroll to bottom when typing status changes
  const typingCount = activeChatId ? typingUsers[activeChatId]?.length || 0 : 0;
  React.useEffect(() => {
    if (typingCount > 0 && isInitialScrollDone && isOpen) {
      scrollToBottom("smooth");
    }
  }, [typingCount, scrollToBottom, isInitialScrollDone, isOpen]);

  // Focus input when changing rooms inside popup
  React.useEffect(() => {
    if (activeChatId && isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [activeChatId, isOpen]);

  // Auto-mark as read when looking at a chat inside popup
  React.useEffect(() => {
    if (isOpen && activeChatId && activeRoom && activeRoom.unreadCount > 0) {
      void markAsRead(activeChatId).then(() => {
        void refetchChats();
      });
    }
  }, [isOpen, activeChatId, activeRoom, refetchChats]);

  // Handle typing indicator
  const [isTyping, setIsTyping] = React.useState(false);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (!activeChatId) return;

    if (!val.trim()) {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(activeChatId, false);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      return;
    }

    if (!isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeChatId, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTypingIndicator(activeChatId, false);
    }, 15000);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !activeChatId || isSending) return;

    const content = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      await sendMessage(activeChatId, content);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.danger("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      setIsTyping(false);
      if (activeChatId) {
        sendTypingIndicator(activeChatId, false);
      }
    }
  };

  const handleContactClick = async (contact: ChatContactResModel) => {
    if (isCreatingChat) return;

    if (contact.chatId) {
      setActiveChatId(contact.chatId);
      setIsContactsOpen(false);
      return;
    }

    setIsCreatingChat(true);
    try {
      const newChatId = await getOrCreatePrivateChat(contact.userId);
      if (newChatId) {
        await refetchChats();
        await refetchContacts();
        setActiveChatId(newChatId);
        setIsContactsOpen(false);
      } else {
        toast.danger("Không thể tạo phòng chat riêng.");
      }
    } catch (err) {
      console.error(err);
      toast.danger("Có lỗi xảy ra khi bắt đầu cuộc trò chuyện.");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleOpenContacts = () => {
    void refetchContacts();
    setIsContactsOpen(true);
  };

  // Filter rooms
  const filteredRooms = React.useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((r) => r.title.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  if (!isAuthenticated || isChatRoute) return null;

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 z-40 size-14 rounded-full bg-gradient-to-tr from-[#48cae4] to-[#00b4d8] text-white flex items-center justify-center shadow-lg shadow-[#00b4d8]/30 hover:scale-105 hover:shadow-xl active:scale-95 transition-all duration-300 cursor-pointer border border-white/10"
        title="Trò chuyện nhanh"
      >
        <TbMessage className="size-6" />
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Floating Chat Popup Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed right-6 bottom-24 z-40 w-[850px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[calc(100vh-8rem)] flex flex-col border border-divider bg-background/95 p-0 backdrop-blur-md shadow-2xl rounded-2xl overflow-hidden"
          >
            <Card className="w-full h-full border-none bg-transparent shadow-none p-0 flex flex-col rounded-none">
          {/* Main Popup Header */}
          <div className="flex items-center justify-between border-b border-divider bg-content1/40 px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <TbMessage className="size-5 text-primary animate-pulse" />
              <span className="font-bold text-sm tracking-tight">Trò chuyện nhanh</span>
              <span
                className={`size-2 rounded-full ${connectionStatus === "connected"
                  ? "bg-emerald-500 animate-pulse"
                  : connectionStatus === "connecting" || connectionStatus === "reconnecting"
                    ? "bg-amber-500"
                    : "bg-red-500"
                  }`}
                title={`SignalR: ${connectionStatus === "connected" ? "Đã kết nối" : "Mất kết nối"}`}
              />
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              onPress={() => setIsOpen(false)}
              className="size-7 min-w-7 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <TbX className="size-4" />
            </Button>
          </div>

          {/* Popup Body (Two-column layout) */}
          <div className="flex-1 flex flex-row overflow-hidden bg-content2/5">
            {/* LEFT SIDE: Chat list column */}
            <div className="w-72 shrink-0 border-r border-divider flex flex-col p-3 overflow-hidden bg-content1/10">
              {/* Search Bar */}
              <div className="relative mb-2.5 shrink-0">
                <Input
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 w-full"
                />
                <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
              </div>

              {/* Support contact button (for students/guardians) */}
              {isStudentOrGuardian && (
                <Button
                  onClick={handleOpenContacts}
                  size="sm"
                  className="mb-2.5 w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shrink-0 font-semibold flex items-center justify-center gap-2 rounded-xl"
                >
                  <TbUsers className="size-4" />
                  Liên hệ hỗ trợ
                </Button>
              )}

              {/* Chat Rooms Scroll List */}
              <ScrollShadow className="flex-grow space-y-2 pr-1 custom-scrollbar overflow-y-auto">
                {filteredRooms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <TbBrandHipchat className="size-10 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Không tìm thấy phòng chat nào.</p>
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const isActive = room.chatId === activeChatId;
                    return (
                      <button
                        key={room.chatId}
                        onClick={() => setActiveChatId(room.chatId)}
                        className={`w-full rounded-2xl p-2.5 text-left transition-all duration-200 flex items-center gap-3 cursor-pointer border ${isActive
                          ? "bg-primary/15 border-primary/45 shadow-sm hover:bg-primary/20"
                          : "bg-content1/40 border-divider/60 hover:bg-primary/5 hover:border-primary/20"
                          }`}
                      >
                        <Avatar
                          className="size-9 font-bold shrink-0 text-white"
                        >
                          <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-xs">
                            {room.title.substring(0, 2).toUpperCase()}
                          </Avatar.Fallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-xs truncate">{room.title}</p>
                            <span className="text-[9px] text-muted-foreground whitespace-nowrap ml-2">
                              {room.lastMessageTime ? formatRoomDate(room.lastMessageTime) : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-[11px] text-muted-foreground truncate flex-1 pr-2">
                              {room.lastMessage || "Chưa có tin nhắn."}
                            </p>
                            {room.unreadCount > 0 && (
                              <span className="flex items-center justify-center size-4.5 rounded-full text-[9px] font-bold text-white bg-red-500 shrink-0">
                                {room.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </ScrollShadow>
            </div>

            {/* RIGHT SIDE: Message View Area */}
            <div className="flex-grow flex flex-col overflow-hidden bg-content2/5">
              {activeChatId === null ? (
                /* No active chat selected state */
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                  <TbBrandHipchat className="size-16 text-primary/30 mb-3 animate-bounce" />
                  <p className="font-bold text-sm text-foreground">Trò chuyện nhanh</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Chọn một cuộc trò chuyện để bắt đầu.
                  </p>
                </div>
              ) : (
                /* Active chat room messaging interface */
                <div className="flex-grow flex flex-col overflow-hidden">
                  {/* Active Chat Header */}
                  <div className="flex items-center justify-between border-b border-divider bg-content1/20 px-4 py-3 shrink-0">
                    <div>
                      <p className="font-semibold text-xs text-foreground truncate max-w-[300px]">
                        {activeRoom?.title || "Đang tải..."}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {activeRoom?.classId
                          ? `${activeRoom.numberOfParticipant} thành viên`
                          : "Liên hệ hỗ trợ riêng tư"}
                      </p>
                    </div>
                  </div>

                  {/* Messages Scroll Area */}
                  <div className="flex-grow overflow-hidden relative">
                    {isMessagesLoading ? (
                      <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                        <Spinner size="sm" />
                        <span className="text-[10px] text-muted-foreground">Đang tải tin nhắn...</span>
                      </div>
                    ) : (
                      <ScrollShadow
                        className="h-full w-full p-4 space-y-3 custom-scrollbar overflow-y-auto"
                        onScroll={(e) => {
                          const target = e.target as HTMLDivElement;
                          if (
                            isInitialScrollDone &&
                            target.scrollTop <= 100 &&
                            hasNextPage &&
                            !isFetchingNextPage
                          ) {
                            void fetchNextPage();
                          }
                        }}
                      >
                        {isFetchingNextPage && (
                          <div className="flex justify-center py-1">
                            <Spinner size="sm" />
                          </div>
                        )}
                        {messages.length === 0 ? (
                          <div className="flex h-full flex-col items-center justify-center text-center p-4">
                            <TbBrandHipchat className="size-12 text-muted-foreground/30 mb-2" />
                            <p className="text-xs font-semibold text-muted-foreground">
                              Chưa có tin nhắn nào.
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              Gửi tin nhắn đầu tiên để bắt đầu trò chuyện.
                            </p>
                          </div>
                        ) : (
                          messages.map((msg, idx) => {
                            const isMe = msg.senderId === user?.id;
                            const badgeInfo = getRoleBadge(msg.senderRole);
                            const showDivider =
                              idx === 0 || isDifferentDay(msg.createdAt, messages[idx - 1].createdAt);

                            return (
                              <React.Fragment key={msg.id}>
                                {showDivider && (
                                  <div className="flex items-center justify-center my-3 w-full">
                                    <div className="border-t border-divider flex-grow" />
                                    <span className="mx-2.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground bg-content2/30 px-2.5 py-0.5 rounded-full border border-divider/40">
                                      {formatDividerDate(msg.createdAt)}
                                    </span>
                                    <div className="border-t border-divider flex-grow" />
                                  </div>
                                )}
                                <div
                                  className={`flex gap-2 max-w-[85%] min-w-0 ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                                    }`}
                                >
                                  <Avatar className="size-7 shrink-0 font-semibold text-[9px]">
                                    {msg.senderAvatarUrl && <Avatar.Image src={msg.senderAvatarUrl} />}
                                    <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                                      {msg.senderName.substring(0, 2).toUpperCase()}
                                    </Avatar.Fallback>
                                  </Avatar>
                                  <div
                                    className={`flex flex-col gap-0.5 min-w-0 max-w-full ${isMe ? "items-end" : "items-start"
                                      }`}
                                  >
                                    {!isMe && (
                                      <div className="flex items-center gap-1 px-1">
                                        <span className="text-[10px] font-semibold text-foreground/80">
                                          {msg.senderName}
                                        </span>
                                        <Chip
                                          size="sm"
                                          variant="soft"
                                          color={badgeInfo.color}
                                          className="h-3 text.5 text-[8px] px-1 font-bold rounded"
                                        >
                                          {badgeInfo.label}
                                        </Chip>
                                      </div>
                                    )}
                                    <div
                                      className={`rounded-2xl px-3 py-1.5 shadow-sm text-xs break-words max-w-full ${isMe
                                        ? "bg-gradient-to-tr from-sky-400 to-blue-500 text-white rounded-tr-none"
                                        : "bg-content1 border border-divider/60 text-foreground rounded-tl-none"
                                        }`}
                                    >
                                      {msg.content}
                                    </div>
                                    <span className="text-[8px] text-muted-foreground px-1 mt-0.5">
                                      {formatMessageTime(msg.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </React.Fragment>
                            );
                          })
                        )}
                        {activeChatId && typingUsers[activeChatId]?.length > 0 && (
                          <div className="flex gap-2 max-w-[85%] min-w-0 mr-auto items-end animate-fade-in pb-1">
                            <div className="flex -space-x-1.5 shrink-0">
                              {typingUsers[activeChatId].map((u) => (
                                <Avatar
                                  key={u.userId}
                                  className="size-7 text-[8px] bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white shadow-sm"
                                  title={u.userName}
                                >
                                  {u.avatarUrl ? (
                                    <Avatar.Image alt={u.userName} src={u.avatarUrl} />
                                  ) : null}
                                  <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                                    {u.userName
                                      .split(" ")
                                      .map((part) => part[0])
                                      .join("")
                                      .slice(
                                        u.userName.split(" ").length - 2,
                                        u.userName.split(" ").length
                                      )
                                      .toUpperCase()}
                                  </Avatar.Fallback>
                                </Avatar>
                              ))}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0 max-w-full items-start">
                              <div
                                className={`bg-content1 border border-divider/60 rounded-2xl rounded-tl-none shadow-sm px-4 py-2.5 ${typingStyles.typingBubble}`}
                              >
                                <div className={typingStyles.typingDot}></div>
                                <div className={typingStyles.typingDot}></div>
                                <div className={typingStyles.typingDot}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </ScrollShadow>
                    )}
                  </div>

                  {/* Message Input Form */}
                  <div className="border-t border-divider bg-content1/10 flex flex-col shrink-0">
                    <form onSubmit={handleSend} className="px-3 py-2.5 flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        placeholder="Nhập tin nhắn..."
                        value={inputText}
                        onChange={(e) => handleInputChange(e.target.value)}
                        disabled={isSending}
                        autoComplete="off"
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        isIconOnly
                        variant="primary"
                        isDisabled={!inputText.trim() || isSending}
                        isPending={isSending}
                        className="shadow-md shadow-[#00b4d8]/20 rounded-xl"
                      >
                        <TbSend className="size-4" />
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Support Contacts Modal */}
      <Modal isOpen={isContactsOpen} onOpenChange={setIsContactsOpen}>
        <Modal.Backdrop isOpen={isContactsOpen} onOpenChange={setIsContactsOpen}>
          <Modal.Container size="sm" className="z-[1000]">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Danh bạ liên hệ hỗ trợ</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="pb-6">
                {isContactsLoading ? (
                  <div className="flex flex-col gap-2 py-6 items-center justify-center">
                    <Spinner size="sm" />
                    <span className="text-xs text-muted-foreground">Đang tải liên hệ...</span>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    Không tìm thấy Admin/Manager khả dụng.
                  </div>
                ) : (
                  <ScrollShadow className="max-h-72 space-y-2 no-scrollbar">
                    {contacts.map((contact) => {
                      const isContactActive = !!contact.chatId && contact.chatId === activeChatId;
                      return (
                        <button
                          key={contact.userId}
                          onClick={() => handleContactClick(contact)}
                          disabled={isCreatingChat}
                          className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isContactActive
                            ? "bg-primary/10 border-primary/30 shadow-sm hover:bg-primary/20 hover:border-primary/40"
                            : "bg-content1/40 border-divider/80 hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar size="sm" className="size-9 font-bold shrink-0 text-white">
                              <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-xs">
                                {contact.name.substring(0, 2).toUpperCase()}
                              </Avatar.Fallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="font-semibold text-xs">{contact.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {contact.role.toLowerCase() === "admin"
                                  ? "Quản trị viên"
                                  : "Giảng viên/Trợ giảng"}
                              </p>
                            </div>
                          </div>
                          {isCreatingChat ? (
                            <Spinner size="sm" />
                          ) : (
                            <Chip
                              size="sm"
                              variant="soft"
                              color={contact.chatId ? "success" : "default"}
                            >
                              <Chip.Label className="text-[10px]">
                                {contact.chatId ? "Nhắn tin" : "Bắt đầu chat"}
                              </Chip.Label>
                            </Chip>
                          )}
                        </button>
                      );
                    })}
                  </ScrollShadow>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" size="sm" onPress={() => setIsContactsOpen(false)}>
                  Hủy
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Embedded custom scrollbar styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .custom-scrollbar::-webkit-scrollbar {
              width: 5px;
              height: 5px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: rgba(156, 163, 175, 0.25);
              border-radius: 99px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: rgba(156, 163, 175, 0.45);
            }
            .custom-scrollbar {
              scrollbar-width: thin;
              scrollbar-color: rgba(156, 163, 175, 0.25) transparent;
            }
          `,
        }}
      />
    </>
  );
}
