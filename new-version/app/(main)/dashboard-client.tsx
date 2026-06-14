"use client";

import { useUser } from "@/context/user-context";
import { Card as StatsCard } from "@/components/classes/card";
import { Card, Button, Chip, Skeleton } from "@heroui/react";
import {
    TbUser,
    TbBook,
    TbCalendarTime,
    TbAward,
    TbClock,
    TbBell,
    TbCalendarCheck,
    TbMessageReport,
    TbArrowRight
} from "react-icons/tb";
import NextLink from "next/link";
import { useStudentOverview } from "@/hooks/users/use-student-overview";

export default function DashboardClient() {
    const { user, isLoading: isUserLoading } = useUser();
    const role = (user?.role || "student").toLowerCase();
    const userName = user?.name || "Học sinh";

    const { data: overview, isLoading: isOverviewLoading } = useStudentOverview({
        userId: user?.id || "",
        enabled: !isUserLoading && (role === "student" || role === "guardian"),
    });

    const isLoading = isUserLoading || isOverviewLoading;

    const gpa = overview?.averageScore !== undefined ? overview.averageScore.toFixed(1) : "0.0";
    const attendanceRate = overview?.attendanceRate !== undefined ? overview.attendanceRate.toFixed(1) : "0.0";

    const formatDateTime = (dateStr: string) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatTime = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
        });
    };
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

    const formatDateTimeNextSession = (value: string) => {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "Chưa có buổi học tiếp theo";
        }

        const pad = (n: number) => n.toString().padStart(2, "0");
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();

        return `${hours}:${minutes}, ${day}/${month}/${year}`;
    };

    if (isLoading) {
        const isGuardian = role === "guardian";
        return (
            <div className={`w-full ${isGuardian ? "max-w-6xl mx-auto p-6 md:p-8" : "px-6"} space-y-8`}>
                {/* Welcome Banner Skeleton */}
                <Skeleton className="h-[200px] w-full rounded-3xl" />

                {/* Quick stats grid Skeleton */}
                <div className={`grid grid-cols-1 ${isGuardian ? "md:grid-cols-3" : "md:grid-cols-4"} gap-6`}>
                    {[...Array(isGuardian ? 3 : 4)].map((_, i) => (
                        <Skeleton key={i} className="h-[104px] w-full rounded-2xl" />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column Skeleton */}
                    <div className="lg:col-span-2 space-y-8">
                        <Skeleton className="h-[300px] w-full rounded-2xl" />
                        <Skeleton className="h-[250px] w-full rounded-2xl" />
                    </div>

                    {/* Right Column Skeleton */}
                    <div className="space-y-8">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (role === "student") {
        return (
            <div className="w-full px-6 space-y-8">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#00b4d8] to-[#48cae4] p-8 md:p-10 text-white shadow-xl shadow-[#00b4d8]/20">
                    <div className="relative z-10 max-w-xl space-y-4">
                        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                            Cổng thông tin dành cho Học sinh
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Chào mừng trở lại, {userName}!
                        </h1>
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                            Xem thông tin lớp học, lịch học cố định, chuyên cần điểm danh và kết quả thi học lực của bạn.
                        </p>
                    </div>
                    {/* Decorative abstract shape */}
                    <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/10 rounded-l-full transform translate-x-12 scale-125 pointer-events-none hidden md:block" />
                </div>

                {/* Quick stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatsCard
                        color="purple"
                        logo={<TbBook className="size-6" />}
                        title="Lớp Học Hiện Tại"
                        description={overview?.className || "Chưa tham gia lớp"}
                    />
                    <StatsCard
                        color="emerald"
                        logo={<TbAward className="size-6" />}
                        title="Điểm Trung Bình (GPA)"
                        description={`${gpa} / 10`}
                    />
                    <StatsCard
                        color="cyan"
                        logo={<TbCalendarCheck className="size-6" />}
                        title="Tỷ Lệ Điểm Danh"
                        description={`${attendanceRate}%`}
                    />
                    <StatsCard
                        color="amber"
                        logo={<TbMessageReport className="size-6" />}
                        title="Buổi học tiếp theo"
                        description={
                            <span title={formatDateTimeNextSession(overview?.nextSession || "Chưa có")}>
                                {formatDateTimeNextSession(overview?.nextSession || "Chưa có")}
                            </span>
                        }
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left & Middle Column: Schedule & Grades */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Upcoming classes */}
                        <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TbCalendarTime className="text-[#00b4d8] size-5" />
                                    Lịch học gần đây
                                </h3>
                                <NextLink href="/schedule">
                                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 font-semibold flex items-center gap-1 border border-primary/25 rounded-lg">
                                        Xem lịch học đầy đủ <TbArrowRight />
                                    </Button>
                                </NextLink>
                            </div>
                            <div className="space-y-4">
                                {/* {overview?.nextSession ? (
                                    <div className="flex items-center justify-between p-4 border border-divider/60 rounded-xl bg-content1/40 hover:bg-content1/80 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-10 rounded-full bg-[#00b4d8]" />
                                            <div>
                                                <h4 className="font-semibold text-sm">Buổi học tiếp theo</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Lớp {overview.className}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold flex items-center gap-1.5 justify-end">
                                                <TbClock className="size-4 text-muted-foreground" /> {formatDateTime(overview.nextSession)} ({formatTime(overview.nextSession)})
                                            </p>
                                            <p className="text-xs text-emerald-500 font-semibold mt-1">Sắp diễn ra</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Chưa có lịch học tiếp theo</p>
                                )} */}

                                {overview?.recentAttendances?.map((attendance, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border border-divider/60 rounded-xl bg-content1/40 hover:bg-content1/80 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-10 rounded-full bg-[#00b4d8]" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-sm">{attendance.sessionType === "Fixed" ? "Buổi học cố định" : attendance.sessionType === "Adhoc" ? "Buổi học bổ sung" : `Buổi học bù cho ${formatDateTime(attendance.note)}`}</h4>
                                                    <Chip size="sm" variant="soft" color={attendance.status === "Pending" ? "success" : attendance.status === "Closed" ? "danger" : "accent"}>
                                                        {attendance.status === "Pending" ? "Sắp diễn ra" : attendance.status === "Closed" ? "Đã kết thúc" : "Đang diễn ra"}
                                                    </Chip>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(attendance.date)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold flex items-center gap-1.5 justify-end">
                                                <TbClock className="size-4 text-muted-foreground" /> {formatTimeOnly(attendance.startTime)} - {formatTimeOnly(attendance.endTime)}
                                            </p>
                                            <Chip
                                                size="sm"
                                                className={
                                                    attendance.attendanceStatus === "Present"
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold mt-1"
                                                        : attendance.attendanceStatus === "Absent"
                                                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold mt-1"
                                                            : attendance.attendanceStatus === "Late"
                                                                ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-semibold mt-1"
                                                                : attendance.attendanceStatus === "Excused" ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold mt-1"
                                                                    : "mt-1"
                                                }
                                            >
                                                {attendance.attendanceStatus === "Present" ? "Có mặt" : attendance.attendanceStatus === "Absent" ? "Vắng mặt" : attendance.attendanceStatus === "Late" ? "Muộn" : attendance.attendanceStatus === "Excused" ? "Vắng mặt có phép" : ""}
                                            </Chip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Recent Grades */}
                        <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TbAward className="text-emerald-500 size-5" />
                                    Kết Quả Kiểm Tra Gần Nhất
                                </h3>
                                <NextLink href="/grades">
                                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 font-semibold flex items-center gap-1 border border-primary/25 rounded-lg">
                                        Xem toàn bộ bảng điểm <TbArrowRight />
                                    </Button>
                                </NextLink>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-divider text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                            <th className="pb-3 pl-2">Ngày kiểm tra</th>
                                            <th className="pb-3">Ca</th>
                                            <th className="pb-3">Nhận xét từ giáo viên</th>
                                            <th className="pb-3 text-right pr-2">Điểm số</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-divider/40 text-sm">
                                        {overview?.recentScores && overview.recentScores.length > 0 ? (
                                            overview.recentScores.slice(0, 3).map((item, index) => (
                                                <tr key={index}>
                                                    <td className="py-3 pl-2 font-semibold">{formatDateTime(item.testDateAt)}</td>
                                                    <td className="py-3 text-muted-foreground">{item.shift || "-"}</td>
                                                    <td className="py-3 text-muted-foreground text-xs">{item.note || "-"}</td>
                                                    <td className="py-3 text-right pr-2 font-bold text-emerald-500">{item.score}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">Chưa có kết quả thi gần đây</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Announcements & Notifications */}
                    <div className="space-y-8">
                        <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl h-full flex flex-col justify-start">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                                <TbBell className="text-amber-500 size-5" />
                                Thông Báo Lớp Học
                            </h3>
                            <div className="space-y-5 flex-1">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Chip size="sm" variant="secondary" className="bg-amber-500/10 text-amber-500 border-none font-semibold">Điểm danh</Chip>
                                        <span className="text-[11px] text-muted-foreground">Hôm nay</span>
                                    </div>
                                    <h4 className="font-semibold text-sm leading-snug">Cập nhật kết quả điểm danh định kỳ</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Hệ thống điểm danh lớp học sẽ tự động đồng bộ sau mỗi buổi học. Học viên vui lòng kiểm tra nếu có sai lệch.
                                    </p>
                                </div>
                                <div className="border-t border-divider/60 pt-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Chip size="sm" variant="secondary" className="bg-[#00b4d8]/10 text-[#00b4d8] border-none font-semibold">Thông báo chung</Chip>
                                        <span className="text-[11px] text-muted-foreground">3 ngày trước</span>
                                    </div>
                                    <h4 className="font-semibold text-sm leading-snug">Công bố điểm thi tháng 5</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        Toàn bộ điểm thi tháng đã được thầy cô nhập vào bảng điểm. Các bạn chọn bộ lọc tháng 5/2026 ở phần "Điểm số" để tra cứu.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    if (role === "guardian") {
        return (
            <div className="w-full px-6 space-y-8">
                {/* Welcome Parent Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-700 p-8 md:p-10 text-white shadow-xl shadow-purple-600/20">
                    <div className="relative z-10 max-w-2xl space-y-4">
                        <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                            Cổng thông tin dành cho Phụ huynh
                        </span>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Chào phụ huynh, {userName}!
                        </h1>
                        <p className="text-white/90 text-sm md:text-base leading-relaxed">
                            Đang theo dõi học tập của: <span className="font-bold underline">{overview?.studentName}</span> — {overview?.className || "Chưa tham gia lớp học"}.
                        </p>
                    </div>
                    <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/10 rounded-l-full transform translate-x-12 scale-125 pointer-events-none hidden md:block" />
                </div>

                {/* Quick stats of Child */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatsCard
                        color="purple"
                        logo={<TbBook className="size-6" />}
                        title="Lớp Học Hiện Tại"
                        description={overview?.className || "Chưa tham gia lớp"}
                    />
                    <StatsCard
                        color="emerald"
                        logo={<TbAward className="size-6" />}
                        title="Điểm Trung Bình (GPA)"
                        description={`${gpa} / 10`}
                    />
                    <StatsCard
                        color="cyan"
                        logo={<TbCalendarCheck className="size-6" />}
                        title="Tỷ Lệ Điểm Danh"
                        description={`${attendanceRate}%`}
                    />
                    <StatsCard
                        color="amber"
                        logo={<TbMessageReport className="size-6" />}
                        title="Buổi học tiếp theo"
                        description={
                            <span title={formatDateTimeNextSession(overview?.nextSession || "Chưa có")}>
                                {formatDateTimeNextSession(overview?.nextSession || "Chưa có")}
                            </span>
                        }
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Schedule and Grades */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Current Schedule today for Child */}
                        <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TbCalendarTime className="text-purple-600 size-5" />
                                    Lịch học gần đây
                                </h3>
                            </div>
                            <div className="space-y-4">
                                {overview?.recentAttendances?.map((attendance, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 border border-divider/60 rounded-xl bg-content1/40 hover:bg-content1/80 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-10 rounded-full bg-[#00b4d8]" />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-sm">{attendance.sessionType === "Fixed" ? "Buổi học cố định" : attendance.sessionType === "Adhoc" ? "Buổi học bổ sung" : `Buổi học bù cho ${formatDateTime(attendance.note)}`}</h4>
                                                    <Chip size="sm" variant="soft" color={attendance.status === "Pending" ? "success" : attendance.status === "Closed" ? "danger" : "accent"}>
                                                        {attendance.status === "Pending" ? "Sắp diễn ra" : attendance.status === "Closed" ? "Đã kết thúc" : "Đang diễn ra"}
                                                    </Chip>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(attendance.date)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold flex items-center gap-1.5 justify-end">
                                                <TbClock className="size-4 text-muted-foreground" /> {formatTimeOnly(attendance.startTime)} - {formatTimeOnly(attendance.endTime)}
                                            </p>
                                            <Chip
                                                size="sm"
                                                className={
                                                    attendance.attendanceStatus === "Present"
                                                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold mt-1"
                                                        : attendance.attendanceStatus === "Absent"
                                                            ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold mt-1"
                                                            : attendance.attendanceStatus === "Late"
                                                                ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-semibold mt-1"
                                                                : attendance.attendanceStatus === "Excused" ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold mt-1"
                                                                    : "mt-1"
                                                }
                                            >
                                                {attendance.attendanceStatus === "Present" ? "Có mặt" : attendance.attendanceStatus === "Absent" ? "Vắng mặt" : attendance.attendanceStatus === "Late" ? "Muộn" : attendance.attendanceStatus === "Excused" ? "Vắng mặt có phép" : ""}
                                            </Chip>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Recent Grades */}
                        <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <TbAward className="text-emerald-500 size-5" />
                                    Điểm Số Các Bài Kiểm Tra Gần Nhất
                                </h3>
                                <NextLink href="/grades">
                                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 font-semibold flex items-center gap-1 border border-primary/25 rounded-lg">
                                        Xem chi tiết <TbArrowRight />
                                    </Button>
                                </NextLink>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-divider text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                                            <th className="pb-3 pl-2">Ngày kiểm tra</th>
                                            <th className="pb-3">Ca học</th>
                                            <th className="pb-3 text-center">Điểm số</th>
                                            <th className="pb-3 text-right pr-2">Ý kiến phản hồi / Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-divider/40 text-sm">
                                        {overview?.recentScores && overview.recentScores.length > 0 ? (
                                            overview.recentScores.slice(0, 3).map((item, index) => (
                                                <tr key={index}>
                                                    <td className="py-3 pl-2 font-semibold">{formatDateTime(item.testDateAt)}</td>
                                                    <td className="py-3 text-muted-foreground">{item.shift || "-"}</td>
                                                    <td className="py-3 text-center font-bold text-emerald-500">{item.score}</td>
                                                    <td className="py-3 text-right pr-2 text-xs text-muted-foreground">{item.note || "-"}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="py-4 text-center text-muted-foreground text-sm">Chưa có kết quả thi gần đây</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>

                    {/* Right Column: Teacher Contact & Feedback */}
                    <div className="space-y-8">
                        <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl h-full flex flex-col justify-start">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                                <TbUser className="text-[#00b4d8] size-5" />
                                Quản Nhiệm Lớp Học
                            </h3>
                            <div className="space-y-6 flex-1">
                                <div className="text-center p-4 bg-content1/30 rounded-2xl border border-divider/60">
                                    <div className="size-16 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                                        GV
                                    </div>
                                    <h4 className="font-bold text-base mt-3">Giảng Viên Phụ Trách</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Lớp 11 Sinh - PTEducation</p>
                                    <p className="text-xs font-semibold text-[#00b4d8] mt-2">support.pte@gmail.com</p>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-sm text-muted-foreground">Gửi yêu cầu tới giáo viên:</h4>
                                    <Button size="sm" variant="secondary" fullWidth className="justify-center font-semibold text-xs py-2 bg-[#00b4d8]/10 text-[#00b4d8] hover:bg-[#00b4d8]/20 rounded-xl">
                                        Xin phép nghỉ học cho con
                                    </Button>
                                    <Button size="sm" variant="ghost" fullWidth className="justify-center font-semibold text-xs py-2 border border-divider hover:bg-content2 text-foreground rounded-xl">
                                        Xem ý kiến phản hồi chi tiết
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    // Default Admin/Manager placeholder (if they somehow view this layout)
    return (
        <div className="w-full max-w-6xl mx-auto space-y-6 p-6 md:p-8">
            <Card className="p-8 border border-divider bg-background/50 backdrop-blur-md rounded-2xl">
                <h1 className="text-2xl font-bold">PT Education System</h1>
                <p className="text-muted-foreground mt-2">
                    Chào mừng quản trị viên! Bạn có thể quản lý người dùng, lớp học và xem báo cáo bằng thanh công cụ bên trái.
                </p>
            </Card>
        </div>
    );
}
