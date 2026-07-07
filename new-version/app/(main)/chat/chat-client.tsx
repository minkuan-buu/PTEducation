"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  Avatar,
  Input,
  Button,
  ScrollShadow,
  Spinner,
  Chip,
  Badge,
} from "@heroui/react";
import { toast } from "@heroui/react";
import {
  TbSend,
  TbMessage,
  TbSearch,
  TbCircleDot,
  TbBrandHipchat,
} from "react-icons/tb";

import { useUser } from "@/context/user-context";
import { useChatRealtime } from "@/context/chat-context";
import {
  getChatMessages,
  sendMessage,
  markAsRead,
  type ChatMessageResModel,
} from "@/services/api/v2/chat";

function formatMessageTime(timestamp: number) {
  if (!timestamp) return "";
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
  const { chats, connectionStatus, activeChatId, setActiveChatId, refetchChats } = useChatRealtime();
  
  const [searchQuery, setSearchQuery] = React.useState("");
  const [inputText, setInputText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // 1. Fetch messages of active room
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<ChatMessageResModel[]>({
    queryKey: ["chat-messages", activeChatId],
    queryFn: () => getChatMessages(activeChatId!),
    enabled: !!activeChatId,
    staleTime: Infinity, // messages are driven entirely by SignalR invalidation
  });

  const activeRoom = React.useMemo(() => {
    return chats.find((r) => r.chatId === activeChatId) || null;
  }, [chats, activeChatId]);

  // Scroll to bottom when messages update
  const scrollToBottom = React.useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  React.useEffect(() => {
    if (messages.length > 0) {
      // Small timeout to ensure DOM layout has completed
      const timer = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, scrollToBottom]);

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
            <h1 className="text-xl font-bold tracking-tight">Hộp thư lớp học</h1>
          </div>
          {/* SignalR Connection Status Indicator */}
          <Chip
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
          </Chip>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Input
            placeholder="Tìm kiếm lớp học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 w-full"
          />
          <TbSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
        </div>

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
                  className={`w-full rounded-2xl p-3 text-left transition-all duration-300 flex items-center gap-3 border ${
                    isActive
                      ? "bg-primary/10 border-primary/30 shadow-sm"
                      : "bg-content1/30 border-transparent hover:bg-content1/50 hover:border-divider"
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
                <p className="text-xs text-muted-foreground">Phòng học realtime</p>
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
                <ScrollShadow className="h-full w-full p-6 space-y-4 no-scrollbar">
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <TbBrandHipchat className="size-16 text-muted/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Chào mừng đến với cuộc trò chuyện của lớp!
                      </p>
                      <p className="text-xs text-muted/60 mt-1">Hãy gửi tin nhắn đầu tiên.</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderId === user?.id;
                      const badgeInfo = getRoleBadge(msg.senderRole);

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 max-w-[75%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                        >
                           <Avatar className="size-8 shrink-0 font-semibold">
                            {msg.senderAvatarUrl && <Avatar.Image src={msg.senderAvatarUrl} />}
                            <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-[10px] flex items-center justify-center">
                              {msg.senderName.substring(0, 2).toUpperCase()}
                            </Avatar.Fallback>
                          </Avatar>
                          <div className="flex flex-col gap-1">
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
                              className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm break-words ${
                                isMe
                                  ? "bg-gradient-to-tr from-sky-400 to-blue-500 text-white rounded-tr-none"
                                  : "bg-content1 border border-divider/60 text-foreground rounded-tl-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[9px] text-muted-foreground px-1 mt-0.5 text-right">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Anchor div for auto-scrolling */}
                  <div ref={messagesEndRef} />
                </ScrollShadow>
              )}
            </div>

            {/* Input gửi tin nhắn */}
            <form
              onSubmit={handleSend}
              className="border-t border-divider bg-content1/10 px-6 py-4 flex items-center gap-3 shrink-0"
            >
              <Input
                ref={inputRef}
                placeholder="Nhập tin nhắn..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
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
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <TbBrandHipchat className="size-20 text-primary/30 mb-4 animate-bounce" />
            <h2 className="text-xl font-bold text-foreground">Trò chuyện Realtime</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Chọn một lớp học từ danh sách bên trái để tham gia thảo luận và nhận hỗ trợ học tập trực tiếp.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
