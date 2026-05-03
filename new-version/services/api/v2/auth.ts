import { createApiClient } from "../client";
import type { ApiResponse } from "../types";
import { clearAccessToken, setAccessToken } from "../token";

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginUser = {
  id: string;
  username: string;
  email?: string;
  token: string;
};

const api = createApiClient("v2");

export async function login(payload: LoginPayload) {
  const response = await api.post<ApiResponse<LoginUser>>(
    "/authentication/login",
    payload,
  );

  const result = response.data;
  console.log(result);

  if (result.data.token) {
    setAccessToken(result.data.token);
  }

  return result;
}

export async function logout() {
  const response = await api.post<ApiResponse<null>>("/auth/logout");

  clearAccessToken();

  return response.data;
}
