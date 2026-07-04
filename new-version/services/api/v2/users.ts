import { createApiClient } from "../client";
import type { ApiResponse } from "../types";
import type { Guardian } from "./admin";



export type GuardianStudentDto = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl?: string | null;
  schoolInfo?: string | null;
  relationship: string;
  isPrimary: boolean;
};

export type GuardianProfileDto = {
  managedStudents: GuardianStudentDto[];
};

export type AdminProfileDto = {
  totalStudentsCount: number;
  totalClassesCount: number;
  totalGuardiansCount: number;
  totalManagersCount: number;
  activeClassesCount: number;
};

export type UserProfileResModel = {
  id: string;
  name: string;
  email: string;
  phone: string;
  className?: string | null;
  avatarUrl?: string | null;
  role: string;
  schoolInfo?: string | null;
  status?: string | null;
  guardianProfile?: GuardianProfileDto | null;
  adminProfile?: AdminProfileDto | null;
  guardians?: Guardian[] | null;
};

import type { UserEditResModel } from "./admin";

// Note: This endpoint is at the root level /api/user, so we might need a custom client or we can just use the root api client.
const api = createApiClient("root"); // Since endpoint is /api/user/me

export async function getMyProfile() {
  const response = await api.get<ApiResponse<UserProfileResModel>>("/user/me");
  return response.data?.data;
}

export async function uploadMyAvatar(file: File) {
  const formData = new FormData();
  formData.append("File", file);
  const response = await api.post<ApiResponse<any>>("/user/upload-avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function updateMyUserDetail(payload: UserEditResModel) {
  const response = await api.put<ApiResponse<any>>("/user/detail", payload);
  return response.data;
}
