import { createApiClient } from "../client";
import type { ApiResponse } from "../types";

export type CheckAttendancePayload = {
  studentClassId: string;
};

export type UpdateAttendancePayload = {
  studentClassId: string;
  attendanceStatus: string;
};

export type ClassAttendanceSession = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status?: string;
  note?: string | null;
};

export type AttendanceSessionDetailStudent = {
  studentClassId: string;
  studentId: string;
  studentName: string;
  attendanceStatus: string;
  guardians: {
    id: string;
    name: string;
    email: string;
    phone: string;
    relationship: string;
    isPrimary: boolean;
  }[];
};

export type AttendanceSessionDetail = {
  session: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    sessionType: string;
    status: string;
    note: string | null;
  };
  attendanceDetails: AttendanceSessionDetailStudent[];
};

export type CreateAttendancePayload = {
  date: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  note?: string;
};

type AttendanceSessionsResponse =
  | ClassAttendanceSession[]
  | ApiResponse<ClassAttendanceSession[]>
  | { data: ClassAttendanceSession[] };

type AttendanceSessionDetailResponse =
  | AttendanceSessionDetail
  | ApiResponse<AttendanceSessionDetail>
  | { data: AttendanceSessionDetail };

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
): AttendanceSessionDetail | null {
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? null;
  }

  return payload as AttendanceSessionDetail;
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

export async function getAttendanceSessionDetail(attendanceId: string, classId: string) {
  if (!attendanceId) {
    throw new Error("Attendance session id is required.");
  }

  const response = await api.get<AttendanceSessionDetailResponse>(
    `/attendances/${encodeURIComponent(attendanceId)}?classId=${encodeURIComponent(classId)}`,
  );

  return normalizeAttendanceSessionDetail(response.data);
}

export async function createAttendance(
  payload: CreateAttendancePayload,
  classId: string,
) {
  await api.post(
    `/attendances/classes/${encodeURIComponent(classId)}`,
    payload,
  );
}

export async function checkAttendance(
  attendanceId: string,
  payload: CheckAttendancePayload,
) {
  await api.post(
    `/attendances/${encodeURIComponent(attendanceId)}/check-attendance`,
    payload,
  );
}

export async function updateAttendance(
  attendanceId: string,
  payload: UpdateAttendancePayload[],
) {
  await api.patch(`/attendances/${encodeURIComponent(attendanceId)}`, payload);
}

export type UpdateAttendanceSessionPayload = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  note?: string;
};

export async function updateAttendanceSession(
  payload: UpdateAttendanceSessionPayload,
) {
  await api.put(`/attendances/update`, payload);
}

export type GeneralDropdownResModel = {
  id: string;
  name: string;
};

type AbsentSessionsResponse =
  | GeneralDropdownResModel[]
  | ApiResponse<GeneralDropdownResModel[]>
  | { data: GeneralDropdownResModel[] };

function normalizeAbsentSessions(payload: AbsentSessionsResponse): GeneralDropdownResModel[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? [];
  }
  return [];
}

export async function getStudentAbsentSessions(classId: string, studentClassId: string) {
  const response = await api.get<AbsentSessionsResponse>(
    `/attendances/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(studentClassId)}/absent-sessions`,
  );
  return normalizeAbsentSessions(response.data);
}


