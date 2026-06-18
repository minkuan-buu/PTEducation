import { createApiClient } from "../client";
import type { ApiListResponse, ApiResponse } from "../types";

export type AdminGuardian = {
  id: string;
  name: string;
  email: string;
  phone: string;
  relationship?: string;
  isPrimary: boolean;
};

export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  className: string;
  guardians?: AdminGuardian[];
};

export type StudentsPage = {
  data: AdminStudent[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type ApproveStudentPayload = {
  accessStatus: string;
};

export type UserEditResModel = {
  name: string,
  email: string,
  phone: string,
  schoolInfo: string,
  guardians: Guardian[],
}

export type Guardian = {
  id: string,
  name: string,
  email: string,
  phone: string,
  relationship?: string,
  isPrimary: boolean,
}

const api = createApiClient("v2");

function normalizeStudents(
  payload:
    | AdminStudent[]
    | ApiListResponse<AdminStudent>
    | ApiResponse<AdminStudent[]>
    | StudentsPage,
): StudentsPage {
  if (Array.isArray(payload)) {
    return {
      data: payload,
      pageNumber: 1,
      pageSize: payload.length,
      totalPages: 1,
    };
  }

  if (
    "pageNumber" in payload &&
    "pageSize" in payload &&
    "totalPages" in payload
  ) {
    return payload;
  }

  const data = payload.data ?? [];
  const meta = "meta" in payload ? payload.meta : undefined;
  const pageNumber = meta?.page ?? 1;
  const pageSize = meta?.pageSize ?? data.length;
  const totalPages =
    meta?.total && pageSize > 0
      ? Math.max(1, Math.ceil(meta.total / pageSize))
      : 1;

  return {
    data,
    pageNumber,
    pageSize,
    totalPages,
  };
}

export async function getUserEdits(id: string) {
  const response = await api.get<ApiResponse<UserEditResModel>>(`/admin/users/${id}/`);
  return response.data.data;
}

export async function updateUserEdits(id: string, payload: UserEditResModel) {
  const response = await api.put<ApiResponse<any>>(`/admin/users/${id}/`, payload);
  return response.data.data;
}

export async function getAdminStudents(params?: {
  pageIndex?: number;
  pageSize?: number;
  keyword?: string;
}) {
  const response = await api.get<
    | AdminStudent[]
    | ApiListResponse<AdminStudent>
    | ApiResponse<AdminStudent[]>
    | StudentsPage
  >("/admin/students", {
    params: {
      pageIndex: params?.pageIndex,
      pageSize: params?.pageSize,
      Keyword: params?.keyword || undefined,
    },
  });

  return normalizeStudents(response.data);
}

export async function approveStudent(studentId: string, accessStatus: string) {
  const response = await api.patch<
    | AdminStudent[]
    | ApiListResponse<AdminStudent>
    | ApiResponse<AdminStudent[]>
    | StudentsPage
  >(`/admin/students/${studentId}`, {
    accessStatus,
  });

  return normalizeStudents(response.data);
}

export async function deleteStudent(studentId: string) {
  const response = await api.delete<
    | AdminStudent[]
    | ApiListResponse<AdminStudent>
    | ApiResponse<AdminStudent[]>
    | StudentsPage
  >(`/admin/students/${studentId}`);

  return normalizeStudents(response.data);
}
