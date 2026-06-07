import { useEffect, useMemo, useState } from "react";

import { useAttendanceRealtime } from "@/context/attendance-context";

type AttendanceWindowSnapshot = {
  isOpen: boolean;
  source: "clock" | "signalr";
  windowKind: "Current" | "Upcoming" | "None";
  windowTitle: string;
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
  if (ms <= 0) {
    return "đang cập nhật";
  }

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

export function useAttendanceWindow(classId: string) {
  const attendanceRealtime = useAttendanceRealtime();
  const [now, setNow] = useState(() => new Date());
  const serverWindow = attendanceRealtime.windowsByClassId[classId] ?? null;

  const opensAt = useMemo(
    () => parseDateTime(serverWindow?.opensAt),
    [serverWindow?.opensAt],
  );
  const closesAt = useMemo(
    () => parseDateTime(serverWindow?.closesAt),
    [serverWindow?.closesAt],
  );
  const lastUpdatedAt = useMemo(
    () => parseDateTime(serverWindow?.serverTime),
    [serverWindow?.serverTime],
  );

  const windowKind = useMemo<AttendanceWindowSnapshot["windowKind"]>(() => {
    const payloadKind = serverWindow?.windowKind?.toLowerCase();

    if (payloadKind === "current") {
      return "Current";
    }

    if (payloadKind === "upcoming") {
      return "Upcoming";
    }

    if (payloadKind === "none") {
      return "None";
    }

    if (opensAt && closesAt && now >= opensAt && now <= closesAt) {
      return "Current";
    }

    if (opensAt) {
      return "Upcoming";
    }

    return "None";
  }, [closesAt, opensAt, now, serverWindow?.windowKind]);

  const windowTitle =
    windowKind === "Current"
      ? "Buổi học hiện tại"
      : windowKind === "Upcoming"
        ? "Buổi học tiếp theo"
        : "Chưa có buổi học tiếp theo";

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
  }, [
    classId,
    attendanceRealtime.connectionStatus,
    serverWindow?.opensAt,
    serverWindow?.closesAt,
  ]);

  const isOpen = windowKind === "Current";
  const source: AttendanceWindowSnapshot["source"] = serverWindow
    ? "signalr"
    : "clock";
  const targetAt = windowKind === "Current" ? closesAt : opensAt;
  const statusLabel =
    windowKind === "Current"
      ? "Đang diễn ra"
      : windowKind === "Upcoming"
        ? "Sắp diễn ra"
        : "Chưa có buổi học nào";
  const countdownLabel = targetAt
    ? windowKind === "Current"
      ? `Kết thúc sau ${formatCountdown(targetAt.getTime() - now.getTime())}`
      : `Bắt đầu sau ${formatCountdown(targetAt.getTime() - now.getTime())}`
    : "Chưa có buổi học tiếp theo";

  return {
    isOpen,
    source,
    windowKind,
    windowTitle,
    statusLabel,
    countdownLabel,
    connectionStatus: attendanceRealtime.connectionStatus,
    opensAt,
    closesAt,
    lastUpdatedAt,
    errorMessage: attendanceRealtime.errorMessage,
  } satisfies AttendanceWindowSnapshot;
}
