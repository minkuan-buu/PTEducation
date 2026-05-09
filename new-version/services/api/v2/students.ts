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

const api = createApiClient("v2");

function normalizeStudents(
  payload:
    | AdminStudent[]
    | ApiListResponse<AdminStudent>
    | ApiResponse<AdminStudent[]>,
): AdminStudent[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.data ?? [];
}

export async function getAdminStudents() {
  const response = await api.get<
    AdminStudent[] | ApiListResponse<AdminStudent> | ApiResponse<AdminStudent[]>
  >("/admin/students");

  return normalizeStudents(response.data);
}
