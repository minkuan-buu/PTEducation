"use client";

import { useUser } from "@/context/user-context";
import { Card, Button, Chip } from "@heroui/react";
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

export default function AttendancePage() {
    const { user } = useUser();
    const role = (user?.role || "guardian").toLowerCase();
    const studentName = role === "guardian" ? "Nguyễn Văn A" : user?.name || "Học sinh";

    const [months, setMonths] = useState<AttendanceMonthResModel[]>([]);
    const [selectedMonthId, setSelectedMonthId] = useState<string>("");
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceStudentDetailResModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load available months
    useEffect(() => {
        async function loadMonths() {
            try {
                const monthsRes = await getStudentAttendanceMonths();
                if (monthsRes && monthsRes.length > 0) {
                    setMonths(monthsRes);
                    setSelectedMonthId(monthsRes[0].id);
                } else {
                    // Fallback mock months
                    const today = new Date();
                    const currentMonth = today.getMonth() + 1;
                    const currentYear = today.getFullYear();
                    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
                    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

                    const mockMonths: AttendanceMonthResModel[] = [
                        { id: `${currentMonth}/${currentYear}`, month: currentMonth, year: currentYear },
                        { id: `${prevMonth}/${prevYear}`, month: prevMonth, year: prevYear }
                    ];
                    setMonths(mockMonths);
                    setSelectedMonthId(mockMonths[0].id);
                }
            } catch (err) {
                console.error("Error loading attendance months:", err);
                const today = new Date();
                const m = today.getMonth() + 1;
                const y = today.getFullYear();
                setMonths([{ id: `${m}/${y}`, month: m, year: y }]);
                setSelectedMonthId(`${m}/${y}`);
            }
        }

        if (role === "student" || role === "guardian") {
            loadMonths();
        }
    }, [role]);

    // Load attendance for selected month
    useEffect(() => {
        if (!selectedMonthId) return;

        async function loadAttendance() {
            setIsLoading(true);
            try {
                const [monthStr, yearStr] = selectedMonthId.split("/");
                const month = parseInt(monthStr, 10);
                const year = parseInt(yearStr, 10);

                const res = await getStudentAttendanceByMonth(month, year);
                if (res && res.attendances && res.attendances.length > 0) {
                    setAttendanceLogs(res.attendances);
                } else {
                    // Fallback logs
                    if (month === 6 || month === 5) {
                        setAttendanceLogs([
                            { date: `${year}-${String(month).padStart(2, '0')}-08T08:00:00Z`, startTime: "08:00", endTime: "10:00", isPresent: true },
                            { date: `${year}-${String(month).padStart(2, '0')}-03T08:00:00Z`, startTime: "08:00", endTime: "10:00", isPresent: true },
                            { date: `${year}-${String(month).padStart(2, '0')}-01T08:00:00Z`, startTime: "08:00", endTime: "10:00", isPresent: true },
                            { date: `${year}-${String(month).padStart(2, '0')}-28T13:30:00Z`, startTime: "13:30", endTime: "15:30", isPresent: false }
                        ]);
                    } else {
                        setAttendanceLogs([]);
                    }
                }
            } catch (err) {
                console.error("Error fetching student attendance logs:", err);
                setAttendanceLogs([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadAttendance();
    }, [selectedMonthId]);

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
    const presentSessions = attendanceLogs.filter(a => a.isPresent).length;
    const absentSessions = totalSessions - presentSessions;
    const attendanceRate = totalSessions > 0
        ? ((presentSessions / totalSessions) * 100).toFixed(1)
        : "100";

    return (
        <div className="w-full max-w-6xl mx-auto space-y-8 p-6 md:p-8">
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
                                                <TbClock className="size-4" /> {log.startTime} - {log.endTime}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-2">
                                            <Chip
                                                size="sm"
                                                className={
                                                    log.isPresent
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                                                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
                                                }
                                            >
                                                {log.isPresent ? "Có mặt" : "Vắng học"}
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
