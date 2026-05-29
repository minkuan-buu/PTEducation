"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Calendar, Chip, Spinner } from "@heroui/react";
import {
    endOfMonth,
    getLocalTimeZone,
    startOfMonth,
    today,
} from "@internationalized/date";
import { useQueryClient } from "@tanstack/react-query";

import { Card } from "@/components/classes/card";
import { v2 } from "@/services/api";
import type { ClassDetail } from "@/services/api/v2";

import { useAttendanceWindow } from "@/hooks/classes/detail/use-attendance-window";
import { useClassCalendarIndicators } from "@/hooks/classes/detail/use-class-calendar-indicators";

function formatDateTime(value?: Date | null) {
    if (!value) {
        return "-";
    }

    return value.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export function ClassAttendancePanel({ classId, classData }: { classId: string; classData: ClassDetail }) {
    const attendanceWindow = useAttendanceWindow(classId, classData.nextSession);
    const queryClient = useQueryClient();
    const [calendarValue, setCalendarValue] = useState(() => today(getLocalTimeZone()));
    const [calendarFocusedValue, setCalendarFocusedValue] = useState(() => calendarValue);
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
    const indicatorSet = useMemo(
        () => new Set(indicatorDates),
        [indicatorDates],
    );

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

    const connectionTone =
        attendanceWindow.connectionStatus === "connected"
            ? "success"
            : attendanceWindow.connectionStatus === "error"
                ? "danger"
                : attendanceWindow.connectionStatus === "reconnecting"
                    ? "warning"
                    : "default";

    return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-4 space-y-4">

                <div className="rounded-2xl border border-divider bg-background p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-muted">Lịch học</p>
                            <p className="mt-1 text-xs text-muted">Đánh dấu ngày có lịch học hoặc học bù.</p>
                        </div>
                        {isIndicatorsLoading ? <Spinner size="sm" /> : null}
                    </div>

                    <div className="mt-4">
                        <Calendar
                            aria-label="Lịch học"
                            value={calendarValue}
                            onChange={setCalendarValue}
                            focusedValue={calendarFocusedValue}
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
                                    {(day) => (
                                        <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                                    )}
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

                    {isIndicatorsError ? (
                        <p className="mt-2 text-xs text-danger">
                            Không thể tải lịch học.
                        </p>
                    ) : null}
                </div>

                <div className="rounded-2xl border border-divider bg-background p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-medium text-muted">Mốc mở tiếp theo</p>
                            <p className="mt-1 text-lg font-semibold">{formatDateTime(attendanceWindow.opensAt)}</p>
                        </div>
                        <Chip color={connectionTone as never} variant="soft">
                            {attendanceWindow.connectionStatus}
                        </Chip>
                    </div>

                    <div className="mt-4 rounded-xl bg-muted/40 p-4">
                        <p className="text-sm text-muted">Đếm ngược</p>
                        <p className="mt-1 text-2xl font-semibold">{attendanceWindow.countdownLabel}</p>
                        <p className="mt-2 text-xs text-muted">Nguồn trạng thái: {attendanceWindow.source === "signalr" ? "SignalR từ BE" : "đồng hồ FE"}</p>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <Button className="flex-1" isDisabled={!attendanceWindow.isOpen} variant={attendanceWindow.isOpen ? "primary" : "secondary"}>
                            {attendanceWindow.isOpen ? "Điểm danh ngay" : "Chưa thể điểm danh"}
                        </Button>
                        {attendanceWindow.connectionStatus === "connecting" ? <Spinner size="sm" /> : null}
                    </div>

                    {attendanceWindow.closesAt ? (
                        <p className="mt-3 text-xs text-muted">Kết thúc dự kiến: {formatDateTime(attendanceWindow.closesAt)}</p>
                    ) : null}
                    {attendanceWindow.lastUpdatedAt ? (
                        <p className="mt-1 text-xs text-muted">Cập nhật gần nhất: {formatDateTime(attendanceWindow.lastUpdatedAt)}</p>
                    ) : null}
                    {attendanceWindow.errorMessage ? <p className="mt-2 text-xs text-danger">{attendanceWindow.errorMessage}</p> : null}
                </div>
            </div>

            <div className="xl:col-span-8 space-y-4">
                {/* <Card
                    logo={<span className="text-lg font-semibold">{classData.totalSessions}</span>}
                    title="Tổng buổi học"
                    description={`${classData.completedSessions} buổi đã diễn ra · ${classData.totalPendingStudent} học sinh đang chờ duyệt`}
                /> */}

                <Card
                    logo={<span className="text-lg font-semibold">{attendanceWindow.isOpen ? "ON" : "OFF"}</span>}
                    title="Trạng thái điểm danh"
                    description={attendanceWindow.statusLabel}
                />

                <div className="rounded-2xl border border-divider bg-background p-5 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Điểm danh realtime</h2>
                            <p className="mt-1 text-sm text-muted">
                                FE tự bật theo đồng hồ và nhận cập nhật từ SignalR. BE vẫn là nơi xác nhận cuối cùng khi sinh viên bấm điểm danh.
                            </p>
                        </div>
                        <Chip color={attendanceWindow.isOpen ? "success" : "warning"} variant="soft">
                            {attendanceWindow.isOpen ? "Có thể thao tác" : "Đang khóa"}
                        </Chip>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-divider p-4">
                            <p className="text-xs uppercase tracking-wide text-muted">Cách hoạt động</p>
                            <p className="mt-2 text-sm text-foreground">
                                Khi đến giờ, SignalR có thể đẩy event mở điểm danh ngay lập tức cho mọi client đang mở trang.
                            </p>
                        </div>
                        <div className="rounded-xl border border-divider p-4">
                            <p className="text-xs uppercase tracking-wide text-muted">Xác nhận</p>
                            <p className="mt-2 text-sm text-foreground">
                                Nút trên FE chỉ là giao diện. API .NET phải kiểm tra lại thời gian trước khi ghi nhận điểm danh.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
