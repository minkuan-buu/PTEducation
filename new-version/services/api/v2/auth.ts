import { createApiClient } from "../client";
import type { ApiResponse } from "../types";

export type LoginPayload = {
  username: string;
  password: string;
};

export type LoginUser = {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  role: "admin" | "student" | "guardian" | "manager";
  token: string;
  isNeedChangePassword?: boolean;
};

export type RegisterPayload = {
  name: string;
  classId: string;
  email: string;
  phone?: string;
  school: string;
  guardians: GuardianInfoReqModel[];
};

export type GuardianInfoReqModel = {
  name: string;
  email: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
};

const api = createApiClient("v2");

export async function login(payload: LoginPayload) {
  const response = await api.post<ApiResponse<LoginUser>>(
    "/authentication/login",
    payload,
  );

  const result = response.data;
  console.log(result);

  return result;
}

export async function logout() {
  const response = await api.post<ApiResponse<null>>("/authentication/logout");

  const result = response.data;
  console.log(result);

  return result;
}

export async function register(payload: RegisterPayload) {
  const response = await api.post<ApiResponse<null>>(
    "/authentication/register",
    payload,
  );

  return response.data;
}

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export async function changePassword(payload: ChangePasswordPayload) {
  const response = await api.post<ApiResponse<null>>(
    "/authentication/change-password",
    payload,
  );

  return response.data;
}
