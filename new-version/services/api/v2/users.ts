import { createApiClient } from "../client";
import type { ApiResponse } from "../types";

export type UserProfileResModel = {
  id: string;
  name: string;
  email: string;
  phone: string;
  className?: string | null;
};

// Note: This endpoint is at the root level /api/user, so we might need a custom client or we can just use the root api client.
const api = createApiClient("root"); // Since endpoint is /api/user/me

export async function getMyProfile() {
  const response = await api.get<ApiResponse<UserProfileResModel>>("/user/me");
  return response.data?.data;
}
