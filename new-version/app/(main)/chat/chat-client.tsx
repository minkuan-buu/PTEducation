"use client";

import * as React from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  Card,
  Avatar,
  Input,
  Button,
  ScrollShadow,
  Spinner,
  Chip,
  Badge,
  Modal,
  useOverlayState,
} from "@heroui/react";
import { toast } from "@heroui/react";
import {
  TbSend,
  TbMessage,
  TbSearch,
  TbCircleDot,
  TbBrandHipchat,
  TbUsers,
} from "react-icons/tb";

import { useUser } from "@/context/user-context";
import { useChatRealtime } from "@/context/chat-context";
import typingStyles from "./typing-indicator.module.css";
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

  // Start of today (00:00:00)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Start of yesterday (00:00:00)
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

export default function ChatClient() {
  const { user } = useUser();
  const { chats, connectionStatus, activeChatId, setActiveChatId, refetchChats, typingUsers, sendTypingIndicator } = useChatRealtime();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [inputText, setInputText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const { isOpen, setOpen, open, close } = useOverlayState();

  // Fetch support contacts
  const { data: contacts = [], isLoading: isContactsLoading, refetch: refetchContacts } = useQuery<ChatContactResModel[]>({
    queryKey: ["support-contacts"],
    queryFn: getSupportContacts,
    enabled: !!user && (user.role?.toLowerCase() === "student" || user.role?.toLowerCase() === "guardian"),
  });

  const [isCreatingChat, setIsCreatingChat] = React.useState(false);

  const handleContactClick = async (contact: ChatContactResModel) => {
    if (isCreatingChat) return;

    if (contact.chatId) {
      setActiveChatId(contact.chatId);
      close();
      return;
    }

    setIsCreatingChat(true);
    try {
      const newChatId = await getOrCreatePrivateChat(contact.userId);
      if (newChatId) {
        await refetchChats(); // refresh conversation list
        await refetchContacts(); // refresh contact list to associate ChatId
        setActiveChatId(newChatId);
        close();
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
    open();
  };

  // 1. Fetch messages of active room
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ["chat-messages", activeChatId],
    queryFn: ({ pageParam = 1 }) => getChatMessages(activeChatId!, pageParam, 50),
    getNextPageParam: (lastPage) => {
      if (lastPage.pageNumber < lastPage.totalPages) {
        return lastPage.pageNumber + 1;
      }
      return undefined;
    },
    enabled: !!activeChatId,
    initialPageParam: 1,
    staleTime: Infinity, // messages are driven entirely by SignalR invalidation
  });

  const messages = React.useMemo(() => {
    if (!messagesData) return [];
    return [...messagesData.pages].reverse().flatMap(page => page.data || []).filter(Boolean);
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
    if (messages.length > 0) {
      const newestMessageId = messages[messages.length - 1].id;
      if (newestMessageId !== newestMessageIdRef.current) {
        const isFirstLoad = newestMessageIdRef.current === null;
        newestMessageIdRef.current = newestMessageId;
        // Use instant scroll for first load, smooth for new messages
        const timer = setTimeout(() => scrollToBottom(isFirstLoad ? "instant" : "smooth"), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [messages, scrollToBottom]);

  // Scroll to bottom when typing status changes
  const typingCount = activeChatId ? typingUsers[activeChatId]?.length || 0 : 0;
  React.useEffect(() => {
    if (typingCount > 0 && isInitialScrollDone) {
      scrollToBottom("smooth");
    }
  }, [typingCount, scrollToBottom, isInitialScrollDone]);

  // Focus input when changing rooms
  React.useEffect(() => {
    if (activeChatId) {
      inputRef.current?.focus();
    }
  }, [activeChatId]);

  // Auto-mark as read when looking at a chat with unread messages
  React.useEffect(() => {
    if (activeChatId && activeRoom && activeRoom.unreadCount > 0) {
      void markAsRead(activeChatId).then(() => {
        void refetchChats();
      });
    }
  }, [activeChatId, activeRoom, refetchChats]);

  // Handle room selection
  const handleSelectRoom = async (roomId: string) => {
    setActiveChatId(roomId);
    try {
      await markAsRead(roomId);
      void refetchChats();
    } catch (err) {
      console.error("Failed to mark chat as read:", err);
    }
  };

  // Handle send message
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
      // Wait for SignalR to push message and trigger invalidation
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.danger("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
      // Keep input focused
      setTimeout(() => inputRef.current?.focus(), 50);

      // Stop typing indicator immediately
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

  // Filter rooms based on query
  const filteredRooms = React.useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((r) => r.title.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  return (
    <div className="flex h-[calc(100vh-1rem)] w-full gap-4 p-4 overflow-hidden">
      {/* Cột trái - Danh sách phòng chat */}
      <Card className="flex h-full w-80 shrink-0 flex-col border border-divider bg-background/50 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <TbMessage className="size-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Trò chuyện</h1>
          </div>
          {/* SignalR Connection Status Indicator */}
          {/* <Chip
            size="sm"
            variant="soft"
            color={
              connectionStatus === "connected"
                ? "success"
                : connectionStatus === "connecting" || connectionStatus === "reconnecting"
                  ? "warning"
                  : "danger"
            }
            className="capitalize"
          >
            <span className="flex items-center gap-1">
              <TbCircleDot className="animate-pulse size-3" />
              {connectionStatus === "connected" ? "Realtime" : "Kết nối..."}
            </span>
          </Chip> */}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Input
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 w-full"
          />
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        </div>

        {/* Contact Support Button for students/parents */}
        {user && (user.role?.toLowerCase() === "student" || user.role?.toLowerCase() === "guardian") && (
          <Button
            onClick={handleOpenContacts}
            className="mb-4 w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 shrink-0 font-medium flex items-center justify-center gap-2"
          >
            <TbUsers className="size-4" />
            Liên hệ hỗ trợ
          </Button>
        )}

        {/* List of chat rooms */}
        <ScrollShadow className="flex-1 space-y-2 pr-1 no-scrollbar">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-muted-foreground">Không tìm thấy phòng chat nào.</p>
            </div>
          ) : (
            filteredRooms.map((room) => {
              const isActive = room.chatId === activeChatId;
              return (
                <button
                  key={room.chatId}
                  onClick={() => handleSelectRoom(room.chatId)}
                  className={`w-full rounded-2xl p-3 text-left transition-all duration-300 flex items-center gap-3 cursor-pointer border ${isActive
                    ? "bg-primary/10 border-primary/30 shadow-sm hover:bg-primary/20 hover:border-primary/40"
                    : "bg-content1/40 border-divider/80 hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm"
                    }`}
                >
                  <Avatar
                    color={isActive ? "accent" : "default"}
                    className="size-10 font-bold shrink-0 text-white"
                  >
                    <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                      {room.title.substring(0, 2).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{room.title}</p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {room.lastMessageTime ? formatRoomDate(room.lastMessageTime) : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-muted-foreground truncate flex-1 pr-2">
                        {room.lastMessage || "Chưa có tin nhắn mới."}
                      </p>
                      {room.unreadCount > 0 && (
                        <span className="flex items-center justify-center size-5 rounded-full text-[10px] font-bold text-white bg-red-500 shrink-0">
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
      </Card>

      {/* Cột phải - Khung chat */}
      <Card className="flex h-full flex-1 flex-col border border-divider bg-background/50 backdrop-blur-md overflow-hidden">
        {activeRoom ? (
          <>
            {/* Header phòng chat */}
            <div className="flex items-center justify-between border-b border-divider bg-content1/20 px-6 py-4">
              <div>
                <h2 className="font-bold text-md text-foreground">{activeRoom.title}</h2>
                <p className="text-xs text-muted-foreground">
                  {activeRoom.classId ? activeRoom.numberOfParticipant + " thành viên" : "Liên hệ hỗ trợ riêng tư"}
                </p>
              </div>
            </div>

            {/* Khung chứa tin nhắn */}
            <div className="flex-1 overflow-hidden relative bg-content2/10">
              {isMessagesLoading ? (
                <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center">
                  <Spinner size="lg" />
                  <span className="text-xs text-muted-foreground">Đang tải tin nhắn...</span>
                </div>
              ) : (
                <ScrollShadow
                  className="h-full w-full p-6 space-y-4 no-scrollbar"
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    if (isInitialScrollDone && target.scrollTop <= 150 && hasNextPage && !isFetchingNextPage) {
                      void fetchNextPage();
                    }
                  }}
                >
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-2">
                      <Spinner size="sm" />
                    </div>
                  )}
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <TbBrandHipchat className="size-16 text-muted/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Chào mừng đến với cuộc trò chuyện của lớp!
                      </p>
                      <p className="text-xs text-muted/60 mt-1">Hãy gửi tin nhắn đầu tiên.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.senderId === user?.id;
                      const badgeInfo = getRoleBadge(msg.senderRole);
                      const showDivider = idx === 0 || isDifferentDay(msg.createdAt, messages[idx - 1].createdAt);

                      return (
                        <React.Fragment key={msg.id}>
                          {showDivider && (
                            <div className="flex items-center justify-center my-4 w-full">
                              <div className="border-t border-divider flex-grow" />
                              <span className="mx-4 text-[10px] font-bold tracking-wide uppercase text-muted-foreground bg-content2/30 px-3 py-1 rounded-full border border-divider/45 shadow-sm">
                                {formatDividerDate(msg.createdAt)}
                              </span>
                              <div className="border-t border-divider flex-grow" />
                            </div>
                          )}
                          <div
                            className={`flex gap-3 max-w-[75%] min-w-0 ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                          >
                            <Avatar className="size-10 shrink-0 font-semibold">
                              {msg.senderAvatarUrl && <Avatar.Image src={msg.senderAvatarUrl} />}
                              <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-[10px] flex items-center justify-center">
                                {msg.senderName.substring(0, 2).toUpperCase()}
                              </Avatar.Fallback>
                            </Avatar>
                            <div className={`flex flex-col gap-1 min-w-0 max-w-full ${isMe ? "items-end" : "items-start"}`}>
                              {/* Sender Info (Only show if not me) */}
                              {!isMe && (
                                <div className="flex items-center gap-1.5 px-1">
                                  <span className="text-xs font-semibold text-foreground/80">
                                    {msg.senderName}
                                  </span>
                                  <Chip size="sm" variant="soft" color={badgeInfo.color} className="h-4 text-[9px] px-1 font-bold">
                                    {badgeInfo.label}
                                  </Chip>
                                </div>
                              )}

                              {/* Message Bubble */}
                              <div
                                className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm break-words max-w-full ${isMe
                                  ? "bg-gradient-to-tr from-sky-400 to-blue-500 text-white rounded-tr-none"
                                  : "bg-content1 border border-divider/60 text-foreground rounded-tl-none"
                                  }`}
                              >
                                {msg.content}
                              </div>
                              <span className="text-[9px] text-muted-foreground px-1 mt-0.5">
                                {formatMessageTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })
                  )}
                  {activeChatId && typingUsers[activeChatId]?.length > 0 && (
                    <div className="flex gap-3 max-w-[75%] min-w-0 mr-auto items-end animate-fade-in pb-2">
                      <div className="flex -space-x-2 shrink-0">
                        {typingUsers[activeChatId].map((u) => (
                          <Avatar
                            key={u.userId}
                            className="size-10 text-[10px] bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white shadow-sm"
                            title={u.userName}
                          >
                            {u.avatarUrl ? (
                              <Avatar.Image
                                alt={u.userName}
                                src={u.avatarUrl}
                              />
                            ) : null}
                            <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                              {u.userName.split(" ").map((part) => part[0]).join("").slice(u.userName.split(" ").length - 2, u.userName.split(" ").length).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0 max-w-full items-start">
                        <div className={`bg-content1 border border-divider/60 rounded-2xl rounded-tl-none shadow-sm px-5 py-4 ${typingStyles.typingBubble}`}>
                          <div className={typingStyles.typingDot}></div>
                          <div className={typingStyles.typingDot}></div>
                          <div className={typingStyles.typingDot}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Anchor div for auto-scrolling */}
                  <div ref={messagesEndRef} />
                </ScrollShadow>
              )}
            </div>

            {/* Input gửi tin nhắn */}
            <div className="border-t border-divider bg-content1/10 flex flex-col shrink-0">
              <form
                onSubmit={handleSend}
                className="px-6 py-4 flex items-center gap-3"
              >
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
                  <TbSend className="size-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <TbBrandHipchat className="size-20 text-primary/30 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-foreground">Trò chuyện</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Chọn một cuộc trò chuyện để bắt đầu.
            </p>
          </div>
        )}
      </Card>

      {/* Modal danh bạ hỗ trợ */}
      <Modal>
        <Modal.Backdrop isOpen={isOpen} onOpenChange={setOpen}>
          <Modal.Container size="md">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Danh bạ liên hệ hỗ trợ</Modal.Heading>
              </Modal.Header>
              <Modal.Body className="pb-6">
                {isContactsLoading ? (
                  <div className="flex flex-col gap-2 py-8 items-center justify-center">
                    <Spinner />
                    <span className="text-xs text-muted-foreground">Đang tải liên hệ...</span>
                  </div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    Không tìm thấy Admin/Manager khả dụng.
                  </div>
                ) : (
                  <ScrollShadow className="max-h-96 space-y-2 no-scrollbar">
                    {contacts.map((contact) => {
                      const isContactActive = !!contact.chatId && contact.chatId === activeChatId;
                      return (
                        <button
                          key={contact.userId}
                          onClick={() => handleContactClick(contact)}
                          disabled={isCreatingChat}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${isContactActive
                            ? "bg-primary/10 border-primary/30 shadow-sm hover:bg-primary/20 hover:border-primary/40"
                            : "bg-content1/40 border-divider/80 hover:bg-primary/5 hover:border-primary/30 hover:shadow-sm"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              className="size-10 font-bold shrink-0 text-white"
                            >
                              <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                                {contact.name.substring(0, 2).toUpperCase()}
                              </Avatar.Fallback>
                            </Avatar>
                            <div className="text-left">
                              <p className="font-semibold text-sm">{contact.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {contact.role.toLowerCase() === "admin" ? "Quản trị viên" : "Giảng viên/Trợ giảng"}
                              </p>
                            </div>
                          </div>
                          {isCreatingChat ? (
                            <Spinner />
                          ) : (
                            <Chip
                              size="sm"
                              variant="soft"
                              color={contact.chatId ? "success" : "default"}
                            >
                              <Chip.Label>{contact.chatId ? "Nhắn tin" : "Bắt đầu chat"}</Chip.Label>
                            </Chip>
                          )}
                        </button>
                      );
                    })}
                  </ScrollShadow>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => close()}>
                  Hủy
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
