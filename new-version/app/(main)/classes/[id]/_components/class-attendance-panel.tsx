"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Calendar,
  Chip,
  Input,
  Spinner,
  Skeleton,
  useOverlayState,
  Accordion,
  Avatar,
} from "@heroui/react";
import {
  endOfMonth,
  getLocalTimeZone,
  startOfMonth,
  today,
} from "@internationalized/date";
import { useQueryClient } from "@tanstack/react-query";

import { v2 } from "@/services/api";
import { useAttendanceRealtime } from "@/context/attendance-context";
import { useAttendanceWindow } from "@/hooks/classes/detail/use-attendance-window";
import { useClassCalendarIndicators } from "@/hooks/classes/detail/use-class-calendar-indicators";
import { useClassAttendanceSessions } from "@/hooks/classes/detail/use-class-attendance-sessions";
import { useAttendanceSessionDetail } from "@/hooks/classes/detail/use-attendance-session-detail";
import CreateAttendanceModal from "./create-attendance-modal";
import { FaChevronDown } from "react-icons/fa6";

const parseDate = (value: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

const formatDateTime = (value: string | Date | null) => {
  const date = parseDate(value);

  if (!date) {
    return "-";
  }

  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${hours}:${minutes}, ${day}/${month}/${year}`;
};

const formatDateOnly = (value: string | Date | null) => {
  const date = parseDate(value);

  if (!date) {
    return "-";
  }

  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

const formatTimeOnly = (value: string | Date | null) => {
  if (!value) {
    return "-";
  }

  if (typeof value === "string") {
    const timeMatch = value.trim().match(/^(\d{1,2}):(\d{2})/);

    if (timeMatch) {
      const hours = pad2(Number(timeMatch[1]));
      const minutes = timeMatch[2];

      return `${hours}:${minutes}`;
    }
  }

  const date = parseDate(value);

  if (!date) {
    return "-";
  }

  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  return `${hours}:${minutes}`;
};

const formatTimeRange = (
  start: string | Date | null,
  end: string | Date | null,
) => {
  if (!start && !end) {
    return "-";
  }

  if (!start) {
    return formatTimeOnly(end);
  }

  if (!end) {
    return formatTimeOnly(start);
  }

  return `${formatTimeOnly(start)} - ${formatTimeOnly(end)}`;
};

import styles from "./class-attendance-panel.module.css";

export function ClassAttendancePanel({ classId }: { classId: string }) {
  const { joinClassGroup, leaveClassGroup } = useAttendanceRealtime();
  const attendanceWindow = useAttendanceWindow(classId);
  const { isOpen, setOpen, close } = useOverlayState();

  useEffect(() => {
    if (!classId) {
      return;
    }

    void joinClassGroup(classId);

    return () => {
      void leaveClassGroup(classId);
    };
  }, [classId, joinClassGroup, leaveClassGroup]);

  const queryClient = useQueryClient();
  const [studentKeyword, setStudentKeyword] = useState("");
  const [calendarValue, setCalendarValue] = useState(() =>
    today(getLocalTimeZone()),
  );
  const [calendarFocusedValue, setCalendarFocusedValue] = useState(
    () => calendarValue,
  );
  const selectedDateIso = useMemo(
    () => calendarValue.toString(),
    [calendarValue],
  );
  const selectedDateLabel = useMemo(
    () => formatDateOnly(calendarValue.toDate(getLocalTimeZone())),
    [calendarValue],
  );
  const calendarRange = useMemo(() => {
    const start = startOfMonth(calendarFocusedValue);
    const end = endOfMonth(calendarFocusedValue);

    return {
      start,
      end,
      startIso: start.toString(),
      endIso: end.toString(),
    };
  }, [calendarFocusedValue]);
  const {
    data: indicatorDates = [],
    isLoading: isIndicatorsLoading,
    isError: isIndicatorsError,
  } = useClassCalendarIndicators(
    classId,
    calendarRange.startIso,
    calendarRange.endIso,
  );
  const indicatorSet = useMemo(() => new Set(indicatorDates), [indicatorDates]);
  const {
    data: attendanceSessions = [],
    isLoading: isSessionsLoading,
    isError: isSessionsError,
  } = useClassAttendanceSessions(classId, selectedDateIso);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const {
    data: selectedSessionDetail,
    isLoading: isSessionDetailLoading,
    isError: isSessionDetailError,
  } = useAttendanceSessionDetail(selectedSessionId);

  useEffect(() => {
    if (!classId) return;

    const prefetchMonth = (offset: number) => {
      const targetDate = calendarFocusedValue.add({ months: offset });
      const start = startOfMonth(targetDate);
      const end = endOfMonth(targetDate);
      const startIso = start.toString();
      const endIso = end.toString();

      queryClient.prefetchQuery({
        queryKey: ["class-calendar-indicators", classId, startIso, endIso],
        queryFn: () =>
          v2.getClassCalendarIndicators(classId, {
            fromDate: startIso,
            toDate: endIso,
          }),
        staleTime: 3 * 60 * 1000,
      });
    };

    prefetchMonth(-1);
    prefetchMonth(1);
  }, [calendarFocusedValue, classId, queryClient]);

  useEffect(() => {
    setSelectedSessionId(null);
  }, [selectedDateIso]);

  useEffect(() => {
    if (!selectedSessionId) return;

    const stillExists = attendanceSessions.some(
      (session) => session.id === selectedSessionId,
    );

    if (!stillExists) {
      setSelectedSessionId(null);
    }
  }, [attendanceSessions, selectedSessionId]);

  const handleCloseModal = close;
  const roster = selectedSessionDetail?.attendanceDetails ?? [];
  const sessionStatus = selectedSessionDetail?.session?.status ?? null;
  const filteredRoster = useMemo(() => {
    const keyword = studentKeyword.trim().toLowerCase();

    if (!keyword) {
      return roster;
    }

    return roster.filter((student) => {
      return (
        student.studentName.toLowerCase().includes(keyword) ||
        student.studentId.toLowerCase().includes(keyword) ||
        student.attendanceStatus.toLowerCase().includes(keyword)
      );
    });
  }, [roster, studentKeyword]);

  const getStudentInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "HS";

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="xl:col-span-3 space-y-4 self-start sticky top-5">
        <div className="relative max-h-[95vh]">
          <div className={`overflow-auto max-h-[95vh] pr-2 space-y-4 ${styles.scrollable} py-4`}>
            <div className="rounded-2xl border border-divider bg-background p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted">Lịch học</p>
                </div>
                {isIndicatorsLoading ? <Spinner size="sm" /> : null}
              </div>

              <div className="mt-4 items-center justify-center flex">
                <Calendar
                  aria-label="Lịch học"
                  className="w-full"
                  focusedValue={calendarFocusedValue}
                  value={calendarValue}
                  onChange={setCalendarValue}
                  onFocusChange={setCalendarFocusedValue}
                >
                  <Calendar.Header>
                    <Calendar.Heading />
                    <div className="flex items-center gap-2">
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </div>
                  </Calendar.Header>
                  <Calendar.Grid>
                    <Calendar.GridHeader>
                      {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                    </Calendar.GridHeader>
                    <Calendar.GridBody>
                      {(date) => (
                        <Calendar.Cell date={date}>
                          {({ formattedDate }) => (
                            <>
                              {formattedDate}
                              {indicatorSet.has(date.toString()) ? (
                                <Calendar.CellIndicator />
                              ) : null}
                            </>
                          )}
                        </Calendar.Cell>
                      )}
                    </Calendar.GridBody>
                  </Calendar.Grid>
                </Calendar>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onPress={() => setOpen(true)}
              >
                Tạo buổi học mới
              </Button>
              <CreateAttendanceModal
                isOpen={isOpen}
                handleOpenChange={setOpen}
                handleCloseModal={close}
                defaultDate={selectedDateIso}
                classId={classId}
              />

              {isIndicatorsError ? (
                <p className="mt-2 text-xs text-danger">Không thể tải lịch học.</p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-divider bg-background p-5 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Các buổi học trong ngày {selectedDateLabel}
                  </h2>
                  {/* <p className="mt-1 text-sm text-muted">{selectedDateLabel}</p> */}
                </div>
                {isSessionsLoading ? <Spinner size="sm" /> : null}
              </div>

              <div className="mt-4 space-y-3">
                {attendanceSessions.length ? (
                  attendanceSessions.map((session) => {
                    const chipTone =
                      session.status === "Pending"
                        ? "warning"
                        : session.status === "Opening"
                          ? "success"
                          : "default";
                    const isSelected = selectedSessionId === session.id;
                    const cardClassName = `w-full text-left rounded-xl border border-divider p-4 transition-all duration-200 ease-out ${isSelected
                      ? "border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20"
                      : "bg-background"
                      } hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md`;

                    return (
                      <button
                        key={session.id}
                        aria-pressed={isSelected}
                        className={cardClassName}
                        type="button"
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {formatTimeRange(session.startTime, session.endTime)}
                            </p>
                            <p className="mt-1 text-xs text-muted">
                              {session.sessionType === "Makeup"
                                ? "Buổi học bù"
                                : session.sessionType === "Adhoc"
                                  ? "Buổi học bổ  sung"
                                  : "Buổi học cố định"}
                            </p>
                          </div>
                          {session.status ? (
                            <Chip color={chipTone as never} variant="soft">
                              {session.status === "Pending"
                                ? "Chưa mở"
                                : session.status === "Opening"
                                  ? "Đang mở"
                                  : "Đã đóng"}
                            </Chip>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted">
                    Chưa có buổi học trong ngày này.
                  </p>
                )}
                {isSessionsError ? (
                  <p className="text-xs text-danger">
                    Không thể tải danh sách buổi học.
                  </p>
                ) : null}
                {selectedSessionId && isSessionDetailLoading ? (
                  <p className="text-xs text-muted">
                    Đang tải chi tiết điểm danh của buổi học...
                  </p>
                ) : null}
                {selectedSessionId && isSessionDetailError ? (
                  <p className="text-xs text-danger">
                    Không thể tải chi tiết buổi học.
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background/95 to-transparent" />
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background/95 to-transparent" />
        </div>
      </div>

      <div className="xl:col-span-9 space-y-4 h-full flex flex-col py-4">
        {/* <Card
                    logo={<span className="text-lg font-semibold">{classData.totalSessions}</span>}
                    title="Tổng buổi học"
                    description={`${classData.completedSessions} buổi đã diễn ra · ${classData.totalPendingStudent} học sinh đang chờ duyệt`}
                /> */}

        <div className="rounded-2xl border border-divider bg-background p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted">
                Buổi học tiếp theo
              </p>

              {attendanceWindow.opensAt ? (
                <p className="mt-1 text-lg font-semibold">
                  {formatDateTime(attendanceWindow.opensAt)}
                </p>
              ) : (
                // <div className="space-y-3">
                //   <Skeleton className="h-3 w-2/5 rounded-lg" />
                //   <Skeleton className="h-3 w-4/5 rounded-lg" />
                // </div>
                <p className="mt-1 text-lg font-semibold">
                  Chưa có buổi học tiếp theo
                </p>
              )}
            </div>
            {/* <Chip color={connectionTone as never} variant="soft">
                            {attendanceWindow.connectionStatus}
                        </Chip> */}
          </div>

          {(() => {
            const ONE_HOUR = 60 * 60 * 1000;
            const shows =
              attendanceWindow.opensAt &&
              (attendanceWindow.isOpen ||
                attendanceWindow.opensAt.getTime() - Date.now() <= ONE_HOUR);

            if (!shows) return null;

            return (
              <div className="mt-4 rounded-xl bg-muted/40 p-4">
                <p className="text-sm text-muted">Đếm ngược</p>
                <p className="mt-1 text-xl font-semibold">
                  {attendanceWindow.opensAt ? (
                    attendanceWindow.countdownLabel
                  ) : (
                    <div className="space-y-3">
                      <Skeleton className="h-3 w-2/5 rounded-lg" />
                      <Skeleton className="h-3 w-4/5 rounded-lg" />
                    </div>
                  )}
                </p>
              </div>
            );
          })()}

          {/* <div className="mt-4 flex items-center gap-3">
            <Button
              className="flex-1"
              isDisabled={!attendanceWindow.isOpen}
              variant={attendanceWindow.isOpen ? "primary" : "secondary"}
            >
              {attendanceWindow.isOpen
                ? "Điểm danh ngay"
                : "Chưa thể điểm danh"}
            </Button>
            {attendanceWindow.connectionStatus === "connecting" ? (
              <Spinner size="sm" />
            ) : null}
          </div> */}

          {attendanceWindow.closesAt ? (
            <p className="mt-3 text-xs text-muted">
              Kết thúc dự kiến: {formatDateTime(attendanceWindow.closesAt)}
            </p>
          ) : null}
          {attendanceWindow.lastUpdatedAt ? (
            <p className="mt-1 text-xs text-muted">
              Cập nhật gần nhất:{" "}
              {formatDateTime(attendanceWindow.lastUpdatedAt)}
            </p>
          ) : null}
          {attendanceWindow.errorMessage ? (
            <p className="mt-2 text-xs text-danger">
              {attendanceWindow.errorMessage}
            </p>
          ) : null}
        </div>

        {/* <Card
                    logo={<span className="text-lg font-semibold">{attendanceWindow.isOpen ? "ON" : "OFF"}</span>}
                    title="Trạng thái điểm danh"
                    description={attendanceWindow.statusLabel}
                /> */}

        {/* <div className="rounded-2xl border border-divider bg-background p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Điểm danh realtime</h2>
              <p className="mt-1 text-sm text-muted">
                FE tự bật theo đồng hồ và nhận cập nhật từ SignalR. BE vẫn là
                nơi xác nhận cuối cùng khi sinh viên bấm điểm danh.
              </p>
            </div>
            <Chip
              color={attendanceWindow.isOpen ? "success" : "warning"}
              variant="soft"
            >
              {attendanceWindow.isOpen ? "Có thể thao tác" : "Đang khóa"}
            </Chip>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-divider p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                Cách hoạt động
              </p>
              <p className="mt-2 text-sm text-foreground">
                Khi đến giờ, SignalR có thể đẩy event mở điểm danh ngay lập tức
                cho mọi client đang mở trang.
              </p>
            </div>
            <div className="rounded-xl border border-divider p-4">
              <p className="text-xs uppercase tracking-wide text-muted">
                Xác nhận
              </p>
              <p className="mt-2 text-sm text-foreground">
                Nút trên FE chỉ là giao diện. API .NET phải kiểm tra lại thời
                gian trước khi ghi nhận điểm danh.
              </p>
            </div>
          </div>
        </div> */}

        {!selectedSessionId ? (
          <div className="flex-1 flex justify-center items-center gap-2 text-xl text-muted">
            <p>Chọn một buổi học ở cột trái để xem trạng thái điểm danh.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-divider bg-background p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted">
                  Danh sách học sinh
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Chip color="default" variant="soft">
                  {filteredRoster.length} học sinh
                </Chip>
                {sessionStatus ? (
                  <Chip
                    color={
                      sessionStatus === "Pending"
                        ? "warning"
                        : sessionStatus === "Opening"
                          ? "success"
                          : "default"
                    }
                    variant="soft"
                  >
                    {sessionStatus === "Pending"
                      ? "Chưa mở"
                      : sessionStatus === "Opening"
                        ? "Đang mở"
                        : "Đã đóng"}
                  </Chip>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Input
                aria-label="Tìm học sinh"
                className="md:max-w-sm"
                placeholder="Tìm theo tên, mã, trạng thái"
                value={studentKeyword}
                onChange={(event) => setStudentKeyword(event.target.value)}
              />
            </div>
            <div className="mt-4 space-y-3">
              {isSessionDetailLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 rounded-2xl" />
                  <Skeleton className="h-20 rounded-2xl" />
                  <Skeleton className="h-20 rounded-2xl" />
                </div>
              ) : filteredRoster.length ? (
                filteredRoster.map((student) => {
                  const statusTone =
                    student.attendanceStatus === "Present"
                      ? "success"
                      : student.attendanceStatus === "Late"
                        ? "warning"
                        : student.attendanceStatus === "Absent"
                          ? "danger"
                          : "default";

                  return (
                    <div
                      key={student.studentClassId}
                      className="group rounded-2xl border border-divider bg-background p-4 transition-shadow hover:shadow-sm overflow-hidden"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          {/* <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {getStudentInitials(student.studentName)}
                          </div> */}
                          <Avatar size="md">
                            <Avatar.Image
                              alt={student.studentName}
                              src={undefined}
                            />
                            <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white">
                              {getStudentInitials(student.studentName)}
                            </Avatar.Fallback>
                          </Avatar>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-foreground">
                                {student.studentName}
                              </p>
                              <Chip color={statusTone as never} variant="soft">
                                {student.attendanceStatus === "Present"
                                  ? "Đã điểm danh"
                                  : student.attendanceStatus === "Late"
                                    ? "Trễ"
                                    : student.attendanceStatus === "Absent"
                                      ? "Vắng mặt"
                                      : "Chưa điểm danh"}
                              </Chip>
                            </div>
                            <p className="mt-1 text-xs text-muted">
                              {student.studentId}
                            </p>
                          </div>
                        </div>
                        <Button className="rounded-xl" variant="primary">
                          Điểm danh
                        </Button>
                      </div>

                      {/* <p className="text-xs uppercase tracking-wide text-muted">
                          Ghi chú
                        </p>
                        <p className="mt-2 text-sm text-foreground">
                          Nếu cần mở rộng, backend có thể trả thêm liên hệ chính
                          hoặc lý do vắng ở endpoint riêng.
                        </p> */}
                      <div className="mt-4">
                        <Accordion
                          className="w-full transition-all duration-100 rounded-xl overflow-hidden"
                          variant="surface"
                        >
                          <Accordion.Item id={student.studentClassId} className="border-none">
                            <Accordion.Heading>
                              {/* Thay đổi ở đây: Chỉ hiện background xám khi aria-expanded là false (nghĩa là đang đóng) */}
                              <Accordion.Trigger className="w-full flex items-center justify-between py-3 px-4 m-0 rounded-xl transition-colors aria-[expanded=false]:hover:bg-gray-200">
                                Thông tin liên hệ
                                <Accordion.Indicator>
                                  <FaChevronDown />
                                </Accordion.Indicator>
                              </Accordion.Trigger>
                            </Accordion.Heading>
                            <Accordion.Panel>
                              <Accordion.Body className="px-4 py-3">
                                {student.guardians.length ? (
                                  student.guardians.map((guardian) => (
                                    <div
                                      key={guardian.id}
                                      className="mb-3 last:mb-0 rounded-lg border border-divider p-3 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-sm"
                                    >
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground">
                                          {guardian.name}
                                        </p>
                                        {guardian.isPrimary ? (
                                          <Chip
                                            color="default"
                                            variant="soft"
                                          >
                                            Liên hệ chính
                                          </Chip>
                                        ) : null}
                                      </div>

                                      <p className="text-sm text-muted">
                                        Mối quan hệ: {guardian.relationship}
                                      </p>
                                      <p className="text-sm text-muted">
                                        Email: {guardian.email}
                                      </p>
                                      <p className="text-sm text-muted">
                                        Số điện thoại: {guardian.phone}
                                      </p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted">
                                    Không có thông tin người giám hộ.
                                  </p>
                                )}
                              </Accordion.Body>
                            </Accordion.Panel>
                          </Accordion.Item>
                        </Accordion>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-dashed border-divider p-5 text-sm text-muted">
                  Không tìm thấy học sinh phù hợp trong buổi học này.
                </div>
              )}

              {isSessionDetailError ? (
                <p className="text-xs text-danger">
                  Không thể tải chi tiết buổi học.
                </p>
              ) : null}
            </div>

            <p className="mt-3 text-xs text-muted">
              Khi backend trả thêm trạng thái chấm thật theo học sinh, UI này
              chỉ cần đổi mapping trạng thái mà không phải thay layout.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
