"use client";

import * as React from "react";
import { HubConnectionBuilder, LogLevel, HubConnectionState, type HubConnection } from "@microsoft/signalr";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@heroui/react";

import { useUser } from "@/context/user-context";
import { getMyChats, type ChatRoomResModel, type ChatMessageResModel } from "@/services/api/v2/chat";
import { buildChatHubUrl, CHAT_SIGNALR_EVENTS } from "@/services/realtime/chat";

type ChatContextValue = {
  chats: ChatRoomResModel[];
  totalUnreadCount: number;
  connectionStatus: "idle" | "connecting" | "connected" | "reconnecting" | "disconnected" | "error";
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  refetchChats: () => Promise<any>;
};

const ChatContext = React.createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const connectionRef = React.useRef<HubConnection | null>(null);
  
  const [connectionStatus, setConnectionStatus] = React.useState<ChatContextValue["connectionStatus"]>("idle");
  const [activeChatId, setActiveChatId] = React.useState<string | null>(null);

  // 1. Fetch user chats using React Query
  const { data: chats = [], refetch: refetchChats } = useQuery<ChatRoomResModel[]>({
    queryKey: ["my-chats"],
    queryFn: getMyChats,
    enabled: !!user,
    staleTime: 10 * 1000, // 10 seconds stale time
  });

  // Calculate total unread count across all rooms
  const totalUnreadCount = React.useMemo(() => {
    return chats.reduce((sum, room) => sum + room.unreadCount, 0);
  }, [chats]);

  // Join a SignalR group room
  const joinRoom = React.useCallback(async (roomId: string) => {
    const conn = connectionRef.current;
    if (conn && conn.state === HubConnectionState.Connected) {
      try {
        await conn.invoke("JoinChatRoom", roomId);
        console.debug(`[ChatHub] Joined group for room: ${roomId}`);
      } catch (err) {
        console.error(`[ChatHub] Failed to join room: ${roomId}`, err);
      }
    }
  }, []);

  // Refs to avoid unnecessary SignalR connection restarts due to state changes
  const chatsRef = React.useRef(chats);
  chatsRef.current = chats;

  const activeChatIdRef = React.useRef(activeChatId);
  activeChatIdRef.current = activeChatId;

  const refetchChatsRef = React.useRef(refetchChats);
  refetchChatsRef.current = refetchChats;

  const queryClientRef = React.useRef(queryClient);
  queryClientRef.current = queryClient;

  const userRef = React.useRef(user);
  userRef.current = user;

  // Helper to re-subscribe to all chats
  const resubscribeAllChats = React.useCallback(async () => {
    const currentChats = chatsRef.current;
    if (currentChats.length > 0) {
      await Promise.all(currentChats.map((room) => joinRoom(room.chatId)));
    }
  }, [joinRoom]);

  // Connect to SignalR Chat Hub
  React.useEffect(() => {
    if (!user) {
      setConnectionStatus("idle");
      connectionRef.current = null;
      return;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(buildChatHubUrl(), { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    connectionRef.current = connection;
    setConnectionStatus("connecting");

    // Lắng nghe sự kiện tin nhắn mới
    const handleReceiveMessage = (message: ChatMessageResModel) => {
      console.debug("[ChatHub] Received message:", message);
      
      // 1. Refresh chat list in background to update last messages and unread counts
      void refetchChatsRef.current();

      // 2. Refresh messages for this chat room if query is active
      void queryClientRef.current.invalidateQueries({ queryKey: ["chat-messages", message.chatId] });

      // 3. Show notification toast if the message is from someone else and not in active room,
      // and only if the document is visible to prevent ViewTransition errors when the tab is hidden.
      const currentUser = userRef.current;
      if (
        currentUser &&
        message.senderId !== currentUser.id &&
        activeChatIdRef.current !== message.chatId &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        toast.success(`Tin nhắn mới từ ${message.senderName}: "${message.content}"`);
      }
    };

    connection.on(CHAT_SIGNALR_EVENTS.receiveMessage, handleReceiveMessage);

    connection.onreconnecting(() => setConnectionStatus("reconnecting"));
    connection.onreconnected(() => {
      setConnectionStatus("connected");
      void resubscribeAllChats();
    });
    connection.onclose(() => setConnectionStatus("disconnected"));

    connection
      .start()
      .then(() => {
        setConnectionStatus("connected");
        void resubscribeAllChats();
      })
      .catch((err) => {
        console.error("[ChatHub] Connection error:", err);
        setConnectionStatus("error");
      });

    return () => {
      connection.off(CHAT_SIGNALR_EVENTS.receiveMessage, handleReceiveMessage);
      connectionRef.current = null;
      void connection.stop();
    };
  }, [user?.id, resubscribeAllChats]);

  // Trigger group joins when chats list or connection changes
  React.useEffect(() => {
    if (connectionRef.current?.state === HubConnectionState.Connected && chats.length > 0) {
      void resubscribeAllChats();
    }
  }, [chats, resubscribeAllChats]);

  const value = React.useMemo<ChatContextValue>(
    () => ({
      chats,
      totalUnreadCount,
      connectionStatus,
      activeChatId,
      setActiveChatId,
      refetchChats,
    }),
    [chats, totalUnreadCount, connectionStatus, activeChatId, refetchChats]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatRealtime() {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error("useChatRealtime must be used within a ChatProvider");
  }
  return context;
}
