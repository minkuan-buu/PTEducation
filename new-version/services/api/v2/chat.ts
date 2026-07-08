import { createApiClient } from "../client";
import type { ApiResponse } from "../types";

export type ChatRoomResModel = {
  chatId: string;
  title: string;
  classId?: string;
  lastMessage?: string;
  lastMessageTime?: number;
  unreadCount: number;
};

export type ChatMessageResModel = {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | null;
  senderRole: string;
  content: string;
  messageType: number;
  createdAt: number;
};

export type ChatContactResModel = {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  chatId?: string | null;
};

const apiV2 = createApiClient("v2");

export async function getMyChats(): Promise<ChatRoomResModel[]> {
  const response = await apiV2.get<ApiResponse<ChatRoomResModel[]>>("/chats");
  return response.data?.data ?? [];
}

export async function getChatMessages(chatId: string, limit?: number): Promise<ChatMessageResModel[]> {
  const response = await apiV2.get<ApiResponse<ChatMessageResModel[]>>(`/chats/${chatId}/messages`, {
    params: { limit },
  });
  return response.data?.data ?? [];
}

export async function sendMessage(chatId: string, content: string, messageType: number = 0): Promise<ChatMessageResModel | null> {
  const response = await apiV2.post<ApiResponse<ChatMessageResModel>>(`/chats/${chatId}/messages`, {
    content,
    messageType,
  });
  return response.data?.data ?? null;
}

export async function markAsRead(chatId: string): Promise<boolean> {
  const response = await apiV2.post<ApiResponse<any>>(`/chats/${chatId}/read`);
  return response.data?.success ?? false;
}

export async function getSupportContacts(): Promise<ChatContactResModel[]> {
  const response = await apiV2.get<ApiResponse<ChatContactResModel[]>>("/chats/contacts");
  return response.data?.data ?? [];
}

export async function getOrCreatePrivateChat(targetUserId: string): Promise<string | null> {
  const response = await apiV2.post<ApiResponse<string>>("/chats/private", {
    targetUserId,
  });
  return response.data?.data ?? null;
}

