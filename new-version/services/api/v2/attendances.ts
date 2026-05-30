import { createApiClient } from "../client";
import type { ApiResponse } from "../types";

export type ClassAttendanceSession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status?: string;
};

type AttendanceSessionsResponse =
  | ClassAttendanceSession[]
  | ApiResponse<ClassAttendanceSession[]>
  | { data: ClassAttendanceSession[] };

type AttendanceSessionDetailResponse =
  | ClassAttendanceSession
  | ApiResponse<ClassAttendanceSession>
  | { data: ClassAttendanceSession };

function normalizeAttendanceSessions(
  payload: AttendanceSessionsResponse,
): ClassAttendanceSession[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? [];
  }

  return [];
}

function normalizeAttendanceSessionDetail(
  payload: AttendanceSessionDetailResponse,
): ClassAttendanceSession | null {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? null;
  }

  return payload as ClassAttendanceSession;
}
const api = createApiClient("v2");

export async function getClassAttendanceSessions(
  classId: string,
  params?: {
    date?: string;
  },
) {
  if (!classId) {
    throw new Error("Class id is required.");
  }

  const response = await api.get<AttendanceSessionsResponse>(
    `/attendances/classes/${encodeURIComponent(classId)}`,
    {
      params: {
        date: params?.date,
      },
    },
  );

  return normalizeAttendanceSessions(response.data);
}

export async function getAttendanceSessionDetail(attendanceId: string) {
  if (!attendanceId) {
    throw new Error("Attendance session id is required.");
  }

  const response = await api.get<AttendanceSessionDetailResponse>(
    `/attendances/${encodeURIComponent(attendanceId)}`,
  );

  return normalizeAttendanceSessionDetail(response.data);
}
