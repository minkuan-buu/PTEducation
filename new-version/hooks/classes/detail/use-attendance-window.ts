import { useEffect, useMemo, useState } from "react";

import { useAttendanceRealtime } from "@/context/attendance-context";

type AttendanceWindowSnapshot = {
  isOpen: boolean;
  source: "clock" | "signalr";
  statusLabel: string;
  countdownLabel: string;
  connectionStatus:
    | "idle"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "disconnected"
    | "error";
  opensAt: Date | null;
  closesAt: Date | null;
  lastUpdatedAt: Date | null;
  errorMessage: string | null;
};

function parseDateTime(value?: string) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatCountdown(ms: number) {
  const safeMs = Math.max(0, ms);
  const totalSeconds = Math.floor(safeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} ngày ${hours} giờ`;
  }

  if (hours > 0) {
    return `${hours} giờ ${minutes} phút`;
  }

  if (minutes > 0) {
    return `${minutes} phút ${seconds} giây`;
  }

  return `${seconds} giây`;
}

export function useAttendanceWindow(classId: string, nextSession?: string) {
  const attendanceRealtime = useAttendanceRealtime();
  const [now, setNow] = useState(() => new Date());
  const serverWindow = attendanceRealtime.windowsByClassId[classId] ?? null;

  const opensAt = useMemo(
    () => parseDateTime(serverWindow?.opensAt ?? nextSession),
    [serverWindow?.opensAt, nextSession],
  );
  const closesAt = useMemo(
    () => parseDateTime(serverWindow?.closesAt),
    [serverWindow?.closesAt],
  );
  const lastUpdatedAt = useMemo(
    () => parseDateTime(serverWindow?.serverTime),
    [serverWindow?.serverTime],
  );

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    setNow(new Date());
  }, [classId, attendanceRealtime.connectionStatus]);

  const isOpen =
    serverWindow?.isOpen ??
    (opensAt ? now.getTime() >= opensAt.getTime() : false);
  const source: AttendanceWindowSnapshot["source"] = serverWindow
    ? "signalr"
    : "clock";
  const statusLabel = isOpen
    ? "Đang mở điểm danh"
    : opensAt
      ? "Chưa đến giờ điểm danh"
      : "Chưa có lịch điểm danh";
  const countdownLabel = opensAt
    ? isOpen
      ? "Đã đến giờ"
      : `Còn ${formatCountdown(opensAt.getTime() - now.getTime())}`
    : "Chưa có thời gian mở";

  return {
    isOpen,
    source,
    statusLabel,
    countdownLabel,
    connectionStatus: attendanceRealtime.connectionStatus,
    opensAt,
    closesAt,
    lastUpdatedAt,
    errorMessage: attendanceRealtime.errorMessage,
  } satisfies AttendanceWindowSnapshot;
}
