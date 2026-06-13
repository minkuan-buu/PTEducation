"use client";

import { useUser } from "@/context/user-context";
import { Card, Button, Chip, Skeleton, ListBox, Select } from "@heroui/react";
import {
    TbAward,
    TbBook,
    TbCheck,
    TbMessageReport,
    TbTrendingUp,
    TbArrowLeft,
    TbCalendar
} from "react-icons/tb";
import NextLink from "next/link";
import { useEffect, useState } from "react";
import {
    getStudentScoresByMonth,
    getStudentScoreMonths,
    type ScoreStudentDetailResModel,
    type ScoreMonthResModel
} from "@/services/api/v2/student";

import { useStudentScoreMonths, useStudentScoresByMonth } from "@/hooks/users/use-student-scores";

export default function GradesPage() {
    const { user, isLoading: isUserLoading } = useUser();
    const role = (user?.role || "student").toLowerCase();
    const isGuardian = role === "guardian";
    const studentName = isGuardian ? "Nguyễn Văn A" : user?.name || "Học sinh";
    const isStudentOrGuardian = role === "student" || role === "guardian";

    const [selectedMonthId, setSelectedMonthId] = useState<string>("");

    const {
        data: monthsData,
        isLoading: isMonthsLoading
    } = useStudentScoreMonths({ enabled: isStudentOrGuardian && !isUserLoading });

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
        data: scoresData,
        isLoading: isScoresLoading,
    } = useStudentScoresByMonth(selectedMonth, selectedYear, {
        enabled: isStudentOrGuardian && !isUserLoading && !!selectedMonthId
    });

    const scores = scoresData?.scores || [];
    const isLoading = isUserLoading || isMonthsLoading || isScoresLoading;

    if (role !== "student" && role !== "guardian") {
        return (
            <div className="w-full max-w-4xl mx-auto p-6 md:p-8">
                <Card className="p-8 border border-divider text-center rounded-2xl bg-background/50 backdrop-blur-md">
                    <p className="text-muted-foreground">Chức năng bảng điểm dành riêng cho Học sinh và Phụ huynh.</p>
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

    // Calculate dynamic GPA for display
    const gpa = scores.length > 0
        ? (scores.reduce((sum, s) => sum + s.score, 0) / scores.length).toFixed(1)
        : "8.5";

    return (
        <div className="w-full px-6 space-y-8 py-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Bảng Điểm Kiểm Tra</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Tra cứu điểm số chi tiết
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
                    <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-2">Chọn Tháng Xem Điểm</label>
                    <div className="relative">
                        {/* <select
                            value={selectedMonthId}
                            onChange={(e) => setSelectedMonthId(e.target.value)}
                            className="w-full rounded-xl border border-divider bg-content1 px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary"
                        >
                            {months.map((m) => (
                                <option key={m.id} value={m.id}>
                                    Tháng {m.month} - Năm {m.year}
                                </option>
                            ))}
                        </select> */}

                        <Select
                            aria-label="Chọn tháng xem điểm"
                            className="rounded-lg min-w-50"
                            selectedKey={selectedMonthId}
                            onSelectionChange={(key) => setSelectedMonthId(String(key))}
                        >
                            <Select.Trigger>
                                <Select.Value />
                                <Select.Indicator />
                            </Select.Trigger>
                            <Select.Popover className="rounded-xl">
                                <ListBox>
                                    {months.map((m) => (
                                        <ListBox.Item key={m.id} id={m.id} textValue={m.id} className="hover:rounded-xl">
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <span>Tháng {m.month} - Năm {m.year}</span>
                                                <ListBox.ItemIndicator />
                                            </div>
                                        </ListBox.Item>
                                    ))}
                                </ListBox>
                            </Select.Popover>
                        </Select>
                    </div>
                </Card>

                {/* Overall Summary Cards */}
                <Card className="p-5 border border-divider bg-background/50 backdrop-blur-md rounded-2xl flex-1 flex flex-row items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                        <TbAward className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">GPA Tháng {selectedMonthId}</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-2xl font-bold text-emerald-500">{scores.length > 0 ? gpa : "-"}</span>
                            {scores.length > 0 && (
                                <Chip size="sm" className="bg-emerald-500/10 text-emerald-500 border-none font-semibold">
                                    {parseFloat(gpa) >= 8.0 ? "Giỏi" : "Khá"}
                                </Chip>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-5 border border-divider bg-background/50 backdrop-blur-md rounded-2xl flex-1 flex flex-row items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-[#00b4d8]/10 text-[#00b4d8] shrink-0">
                        <TbBook className="size-6" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Tổng Số Bài Kiểm Tra</p>
                        <p className="text-2xl font-bold mt-1 text-[#00b4d8]">{scores.length} bài</p>
                    </div>
                </Card>
            </div>

            {/* Detailed Grade components table */}
            <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <TbAward className="text-emerald-500 size-5" />
                        Danh sách điểm thi tháng
                    </h3>
                </div>
                {isLoading ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">Đang tải bảng điểm...</div>
                ) : scores.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">Không tìm thấy dữ liệu điểm kiểm tra trong tháng này.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-xs text-muted-foreground uppercase tracking-wider font-semibold border-b border-divider/40 pb-3">
                                    <th className="pb-3 pl-2 w-16">STT</th>
                                    <th className="pb-3">Ngày kiểm tra</th>
                                    <th className="pb-3">Ca học / Ca thi</th>
                                    <th className="pb-3">Nhận xét của giáo viên</th>
                                    <th className="pb-3 text-right pr-2 w-32">Điểm số</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-divider/40 text-sm">
                                {scores.map((detail, idx) => (
                                    <tr key={idx} className="hover:bg-content1/20 transition-colors">
                                        <td className="py-4 pl-2 font-semibold text-muted-foreground">{idx + 1}</td>
                                        <td className="py-4 font-semibold text-foreground">{formatDateTime(detail.testDateAt)}</td>
                                        <td className="py-4 text-muted-foreground">{detail.shift || "-"}</td>
                                        <td className="py-4 text-xs text-muted-foreground max-w-sm leading-relaxed">
                                            {detail.note || "-"}
                                        </td>
                                        <td className="py-4 text-right pr-2 font-bold text-emerald-500 text-base">
                                            {detail.score}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Parent Confirmation (Guardian role only) */}
            {isGuardian && (
                <Card className="p-6 border border-divider bg-purple-500/5 dark:bg-purple-500/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400">Xác nhận kết quả học tập</h3>
                        <p className="text-xs text-muted-foreground">
                            Nhấn xác nhận để ký tên phụ huynh trực tuyến, xác nhận bạn đã theo dõi đầy đủ bảng điểm thi tháng này của học sinh.
                        </p>
                    </div>
                    <Button
                        size="md"
                        className="bg-purple-600 text-white font-semibold shadow-lg shadow-purple-600/20 hover:scale-102 transition-transform flex items-center gap-1.5 rounded-xl px-5"
                    >
                        <TbCheck className="size-5" />
                        <span>Xác nhận ký tên phụ huynh</span>
                    </Button>
                </Card>
            )}
        </div>
    );
}
