import { createApiClient } from "../client";
import type { ApiListResponse, ApiResponse } from "../types";
import type { AdminStudent, StudentsPage } from "./admin";

export type ClassSchedule = {
  dayOfWeek: number; // 1=Monday, 2=Tuesday, ..., 7=Sunday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export type CreateClassPayload = {
  name: string;
  gradeName?: string;
  startAt: string;
  endAt: string;
  schedules: ClassSchedule[];
};

export type UpdateClassPayload = {
  name: string;
  startAt: string;
  endAt: string;
  schedules?: ClassSchedule[];
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
  weeklySchedules: ClassSchedule[];
};

export type ClassDetail = {
  name: string;
  totalStudent: number;
  totalPendingStudent: number;
  averageScore: number;
  attendanceRate: number;
  totalSessions: number;
  completedSessions: number;
  weeklySchedules: ClassSchedule[];
  startAt: string;
  endAt: string;
  nextSession: string;
};

type ClassDetailResponse =
  | ClassDetail
  | ApiResponse<ClassDetail>
  | { data: ClassDetail };

type CalendarIndicatorsResponse =
  | string[]
  | ApiResponse<string[]>
  | { data: string[] };

export type ClassOption = {
  id: string;
  name: string;
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

function normalizeClassDetail(
  payload: ClassDetailResponse,
): ClassDetail | null {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? null;
  }
  return payload as ClassDetail;
}

function normalizeCalendarIndicators(
  payload: CalendarIndicatorsResponse,
): string[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? [];
  }

  return [];
}

export async function createClass(payload: CreateClassPayload) {
  const response = await api.post<ClassData | ApiResponse<ClassData>>(
    "/classes",
    payload,
  );
  return normalizeClass(response.data);
}

export async function updateClass(classId: string, payload: UpdateClassPayload) {
  const response = await api.put<ApiResponse<any>>(
    `/classes/${encodeURIComponent(classId)}`,
    payload,
  );
  return response.data;
}

export async function deleteClass(classId: string) {
  const response = await api.delete<
    ClassData[] | ApiListResponse<ClassData> | ApiResponse<ClassData[]>
  >(`/admin/classes/${classId}`);
  return normalizeClasses(response.data);
}

export async function getClassDetails(classId: string) {
  if (!classId) {
    throw new Error("Class id is required.");
  }

  const response = await api.get<ClassDetailResponse>(
    `/classes/${encodeURIComponent(classId)}`,
  );

  return normalizeClassDetail(response.data);
}

export async function getClassCalendarIndicators(
  classId: string,
  params?: {
    fromDate?: string;
    toDate?: string;
  },
) {
  if (!classId) {
    throw new Error("Class id is required.");
  }

  const response = await api.get<CalendarIndicatorsResponse>(
    `/classes/${encodeURIComponent(classId)}/calendar-indicators`,
    {
      params: {
        fromDate: params?.fromDate,
        toDate: params?.toDate,
      },
    },
  );

  return normalizeCalendarIndicators(response.data);
}

export async function getStudentsInClass(
  classId: string,
  params?: {
    pageIndex?: number;
    pageSize?: number;
    keyword?: string;
    isPendingFilter?: boolean;
  },
) {
  const response = await api.get<
    | AdminStudent[]
    | ApiListResponse<AdminStudent>
    | ApiResponse<AdminStudent[]>
    | StudentsPage
  >(`/classes/${encodeURIComponent(classId)}/students`, {
    params: {
      pageIndex: params?.pageIndex,
      pageSize: params?.pageSize,
      Keyword: params?.keyword || undefined,
      isPending: params?.isPendingFilter || undefined,
    },
  });

  // normalize to paged shape
  const payload = response.data;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      pageNumber: 1,
      pageSize: payload.length,
      totalPages: 1,
    } as StudentsPage;
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

  return { data, pageNumber, pageSize, totalPages } as StudentsPage;
}

export async function getClassOptions(): Promise<ClassOption[]> {
  const response = await api.get<{ data?: ClassOption[] }>("/classes/select");
  const options = Array.isArray(response.data?.data) ? response.data.data : [];
  return options.sort((a, b) =>
    a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" }),
  );
}
