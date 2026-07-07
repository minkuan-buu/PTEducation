import { getApiBaseUrl } from "@/services/api/config";

export const CHAT_SIGNALR_EVENTS = {
  receiveMessage: "ReceiveMessage",
} as const;

export function buildChatHubUrl() {
  const explicitHubUrl = process.env.NEXT_PUBLIC_CHAT_SIGNALR_URL?.trim();

  if (explicitHubUrl) {
    return explicitHubUrl;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");

  if (!baseUrl) {
    return "/hubs/chat";
  }

  return `${baseUrl}/hubs/chat`;
}
