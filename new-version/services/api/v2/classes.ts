import { createApiClient } from "../client";
import type { ApiListResponse, ApiResponse } from "../types";

export type ClassSchedule = {
  dayOfWeek: number; // 1=Monday, 2=Tuesday, ..., 7=Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export type CreateClassPayload = {
  name: string;
  startAt: string;
  endAt: string;
  schedules: ClassSchedule[];
};

export type ClassData = {
  id: string;
  name: string;
  startAt: string;
  endAt: string;
  status: string;
  totalStudent: number;
  createdBy: {
    id: string;
    name: string;
  };
  schedules: ClassSchedule[];
};

const api = createApiClient("v2");

function normalizeClasses(
  payload: ClassData[] | ApiListResponse<ClassData> | ApiResponse<ClassData[]>,
): ClassData[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.data ?? [];
}

function normalizeClass(
  payload: ClassData | ApiResponse<ClassData>,
): ClassData | null {
  if ("data" in payload && !Array.isArray(payload)) {
    return payload.data;
  }
  return payload as ClassData;
}

export async function getAdminClasses() {
  const response = await api.get<
    ClassData[] | ApiListResponse<ClassData> | ApiResponse<ClassData[]>
  >("/admin/classes");
  return normalizeClasses(response.data);
}

export async function createClass(payload: CreateClassPayload) {
  const response = await api.post<ClassData | ApiResponse<ClassData>>(
    "/admin/classes",
    payload,
  );
  return normalizeClass(response.data);
}

export async function deleteClass(classId: string) {
  const response = await api.delete<
    ClassData[] | ApiListResponse<ClassData> | ApiResponse<ClassData[]>
  >(`/admin/classes/${classId}`);
  return normalizeClasses(response.data);
}
