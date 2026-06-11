"use client";

import { useUser } from "@/context/user-context";
import { Card, Button, Chip, Skeleton } from "@heroui/react";
import {
    TbCalendarCheck,
    TbUserCheck,
    TbUserX,
    TbClock,
    TbArrowLeft,
    TbActivity
} from "react-icons/tb";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import {
    getStudentAttendanceByMonth,
    getStudentAttendanceMonths,
    type AttendanceStudentDetailResModel,
    type AttendanceMonthResModel
} from "@/services/api/v2/student";

import { useStudentAttendanceMonths, useStudentAttendanceByMonth } from "@/hooks/users/use-student-attendance";

export default function AttendancePage() {
    const { user, isLoading: isUserLoading } = useUser();
    const role = (user?.role || "guardian").toLowerCase();
    const studentName = role === "guardian" ? "Nguyễn Văn A" : user?.name || "Học sinh";
    const isStudentOrGuardian = role === "student" || role === "guardian";

    const [selectedMonthId, setSelectedMonthId] = useState<string>("");

    const pad2 = (value: number) => value.toString().padStart(2, "0");
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

    const { 
        data: monthsData, 
        isLoading: isMonthsLoading 
    } = useStudentAttendanceMonths({ enabled: isStudentOrGuardian && !isUserLoading });

    const months = monthsData || [];

    // Auto-select first month when loaded
    useEffect(() => {
        if (months.length > 0 && !selectedMonthId) {
            setSelectedMonthId(months[0].id);
        }
    }, [months, selectedMonthId]);

    const selectedMonth = selectedMonthId ? parseInt(selectedMonthId.split("/")[0], 10) : 0;
    const selectedYear = selectedMonthId ? parseInt(selectedMonthId.split("/")[1], 10) : 0;

    const {
        data: attendanceData,
        isLoading: isAttendanceLoading,
    } = useStudentAttendanceByMonth(selectedMonth, selectedYear, { 
        enabled: isStudentOrGuardian && !isUserLoading && !!selectedMonthId 
    });

    const attendanceLogs = attendanceData?.attendances || [];
    const isLoading = isUserLoading || isMonthsLoading || isAttendanceLoading;

    if (role !== "guardian" && role !== "student" && role !== "admin") {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 md:p-8">
                <Card className="p-8 border border-divider text-center rounded-2xl bg-background/50 backdrop-blur-md">
                    <p className="text-muted-foreground">Chức năng chuyên cần dành riêng cho Phụ huynh và Học sinh.</p>
                </Card>
            </div>
        );
    }

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const totalSessions = attendanceLogs.length;
    const presentSessions = attendanceLogs.filter(a => a.attendanceStatus === "Present").length;
    const absentSessions = totalSessions - presentSessions;
    const attendanceRate = totalSessions > 0
        ? ((presentSessions / totalSessions) * 100).toFixed(1)
        : "100";

    return (
        <div className="w-full px-6 space-y-8 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Nhật Ký Điểm Danh Chuyên Cần</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {role === "guardian"
                            ? `Nhật ký đi học và hiện diện chi tiết của học sinh: ${studentName}`
                            : `Nhật ký đi học và trạng thái chuyên cần hàng ngày của bạn`
                        }
                    </p>
                </div>
                <NextLink href="/">
                    <Button size="sm" variant="ghost" className="border border-divider hover:bg-content2 text-foreground font-semibold rounded-xl flex items-center gap-1">
                        <TbArrowLeft /> Quay lại tổng quan
                    </Button>
                </NextLink>
            </div>

            {/* Filter and Overview Cards */}
            <div className="flex flex-col md:flex-row gap-6">
                {/* Selector */}
                <Card className="p-5 border border-divider bg-background/50 backdrop-blur-md rounded-2xl flex-1 md:max-w-xs justify-center">
                    <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-2">Chọn Tháng Xem Điểm Danh</label>
                    <select
                        value={selectedMonthId}
                        onChange={(e) => setSelectedMonthId(e.target.value)}
                        className="w-full rounded-xl border border-divider bg-content1 px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary"
                    >
                        {months.map((m) => (
                            <option key={m.id} value={m.id}>
                                Tháng {m.month} - Năm {m.year}
                            </option>
                        ))}
                    </select>
                </Card>

                {/* Metrics */}
                <Card className="p-5 border border-divider bg-background/50 backdrop-blur-md rounded-2xl flex-1 flex flex-row items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-[#00b4d8]/10 text-[#00b4d8] shrink-0">
                        <TbActivity className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tỷ lệ đi học</p>
                        <p className="text-2xl font-bold mt-1 text-[#00b4d8]">{attendanceRate}%</p>
                    </div>
                </Card>

                <Card className="p-5 border border-divider bg-background/50 backdrop-blur-md rounded-2xl flex-1 flex flex-row items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                        <TbUserCheck className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Buổi Có Mặt</p>
                        <p className="text-2xl font-bold mt-1 text-emerald-500">{presentSessions} / {totalSessions} buổi</p>
                    </div>
                </Card>

                <Card className="p-5 border border-divider bg-background/50 backdrop-blur-md rounded-2xl flex-1 flex flex-row items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                        <TbUserX className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Buổi Vắng Mặt</p>
                        <p className="text-2xl font-bold mt-1 text-rose-500">{absentSessions} buổi</p>
                    </div>
                </Card>
            </div>

            {/* Attendance Logs Table */}
            <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl">
                <div className="flex items-center gap-2 mb-6">
                    <TbCalendarCheck className="text-[#00b4d8] size-5" />
                    <h2 className="text-lg font-bold">Lịch sử điểm danh chi tiết trong tháng</h2>
                </div>

                {isLoading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">Đang tải nhật ký điểm danh...</div>
                ) : attendanceLogs.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy dữ liệu điểm danh trong tháng này.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b border-divider/40">
                                    <th className="pb-3 pl-2 w-24">STT</th>
                                    <th className="pb-3">Ngày điểm danh</th>
                                    <th className="pb-3">Thời gian lớp học</th>
                                    <th className="pb-3 text-right pr-2">Trạng thái điểm danh</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-divider/40 text-sm">
                                {attendanceLogs.map((log, idx) => (
                                    <tr key={idx} className="hover:bg-content1/20 transition-colors">
                                        <td className="py-4 pl-2 font-semibold text-muted-foreground">{idx + 1}</td>
                                        <td className="py-4 font-semibold text-foreground">{formatDateTime(log.date)}</td>
                                        <td className="py-4 text-muted-foreground">
                                            <span className="inline-flex items-center gap-1.5">
                                                <TbClock className="size-4" /> {formatTimeOnly(log.startTime)} - {formatTimeOnly(log.endTime)}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            <Chip
                                                size="sm"
                                                className={
                                                    log.attendanceStatus === "Present"
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                                                        : log.attendanceStatus === "Absent"
                                                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                                            : log.attendanceStatus === "Late"
                                                                ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-semibold"
                                                                : log.attendanceStatus === "Excused" ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold"
                                                                    : ""
                                                }
                                            >
                                                {log.attendanceStatus === "Present" ? "Có mặt" : log.attendanceStatus === "Absent" ? "Vắng mặt" : log.attendanceStatus === "Late" ? "Trễ" : log.attendanceStatus === "Excused" ? "Vắng mặt có phép" : ""}
                                            </Chip>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
