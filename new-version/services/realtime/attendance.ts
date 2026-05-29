import { getApiBaseUrl } from "@/services/api/config";

export const ATTENDANCE_SIGNALR_EVENTS = {
  serverTimeSynced: "ServerTimeSynced",
  windowStateChanged: "AttendanceWindowStateChanged",
  attendanceUpdated: "AttendanceUpdated",
} as const;

export type AttendanceWindowStatePayload = {
  classId: string;
  isOpen: boolean;
  opensAt?: string;
  closesAt?: string;
  serverTime?: string;
  reason?: string;
};

export type ServerTimeSyncedPayload = {
  serverTime: string;
  offsetMinutes?: number;
};

export function buildAttendanceHubUrl() {
  const explicitHubUrl = process.env.NEXT_PUBLIC_SIGNALR_URL?.trim();

  if (explicitHubUrl) {
    return explicitHubUrl;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, "");

  if (!baseUrl) {
    return "/hubs/attendance";
  }

  return `${baseUrl}/hubs/attendance`;
}
