// "use client";

// import { useUser } from "@/context/user-context";
// import { Card, Button, Chip, Skeleton } from "@heroui/react";
// import WeeklySchedule, { EventItem } from "@/components/weekly-schedule";
// import { TbCalendarTime, TbArrowLeft, TbInfoCircle, TbClock } from "react-icons/tb";
// import NextLink from "next/link";
// import { useEffect, useState } from "react";
// import { useStudentAttendanceMetadata, useStudentAttendanceByMonth } from "@/hooks/users/use-student-attendance";

// const classScheduleEvents: EventItem[] = [
//     {
//         id: "fixed-1",
//         title: "Lịch Học Cố Định (Lớp 11 Sinh)",
//         day: 1, // Thứ 2
//         start: "08:00",
//         end: "10:00",
//         colorTheme: "blue"
//     },
//     {
//         id: "fixed-2",
//         title: "Lịch Học Cố Định (Lớp 11 Sinh)",
//         day: 3, // Thứ 4
//         start: "08:00",
//         end: "10:00",
//         colorTheme: "blue"
//     }
// ];

// export default function SchedulePage() {
//     const { user, isLoading: isUserLoading } = useUser();
//     const role = (user?.role || "student").toLowerCase();

//     const [selectedMonthId, setSelectedMonthId] = useState<string>("");

//     const {
//         data: monthsData,
//         isLoading: isMonthsLoading
//     } = useStudentAttendanceMetadata({ enabled: !isUserLoading && ["student", "guardian", "admin", "manager"].includes(role) });

//     const months = monthsData || [];

//     useEffect(() => {
//         if (months.length > 0 && !selectedMonthId) {
//             setSelectedMonthId(months[0].id);
//         }
//     }, [months, selectedMonthId]);

//     const selectedMonth = selectedMonthId ? parseInt(selectedMonthId.split("/")[0], 10) : 0;
//     const selectedYear = selectedMonthId ? parseInt(selectedMonthId.split("/")[1], 10) : 0;

//     const {
//         data: attendanceData,
//         isLoading: isAttendanceLoading,
//     } = useStudentAttendanceByMonth(selectedMonth, selectedYear, {
//         enabled: !isUserLoading && !!selectedMonthId && ["student", "guardian", "admin", "manager"].includes(role)
//     });

//     const attendanceLogs = attendanceData?.attendances || [];
//     const isLoading = isUserLoading || isMonthsLoading || isAttendanceLoading;

//     if (role !== "student" && role !== "manager" && role !== "admin" && role !== "guardian") {
//         return (
//             <div className="w-full max-w-4xl mx-auto p-6 md:p-8">
//                 <Card className="p-8 border border-divider text-center rounded-2xl bg-background/50 backdrop-blur-md">
//                     <p className="text-muted-foreground">Chức năng thời khóa biểu dành riêng cho Học sinh và Quản lý.</p>
//                 </Card>
//             </div>
//         );
//     }

//     const formatDateTime = (dateStr: string) => {
//         if (!dateStr) return "-";
//         const d = new Date(dateStr);
//         return d.toLocaleDateString("vi-VN", {
//             day: "2-digit",
//             month: "2-digit",
//             year: "numeric",
//         });
//     };

//     return (
//         <div className="w-full px-6 space-y-8 py-6">
//             {/* Header */}
//             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//                 <div>
//                     <h1 className="text-2xl font-bold tracking-tight">Lịch Học Cố Định & Nhật Ký Buổi Học</h1>
//                     <p className="text-muted-foreground mt-1 text-sm">
//                         Xem khung giờ học tập cố định trong tuần của lớp 11 Sinh và lịch sử điểm danh của các buổi học đã diễn ra.
//                     </p>
//                 </div>
//                 <NextLink href="/">
//                     <Button size="sm" variant="ghost" className="border border-divider hover:bg-content2 text-foreground font-semibold rounded-xl flex items-center gap-1">
//                         <TbArrowLeft /> Quay lại tổng quan
//                     </Button>
//                 </NextLink>
//             </div>

//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//                 {/* Weekly Calendar Grid */}
//                 <div className="lg:col-span-2 space-y-6">
//                     <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl shadow-sm">
//                         <div className="flex items-center gap-2 mb-6">
//                             <TbCalendarTime className="text-[#00b4d8] size-5" />
//                             <h2 className="text-lg font-bold">Khung lịch cố định hàng tuần</h2>
//                         </div>
//                         <WeeklySchedule events={classScheduleEvents} hoursStart={7} hoursEnd={18} />
//                     </Card>
//                 </div>

//                 {/* Side Card: Attendance sessions list */}
//                 <div className="space-y-6">
//                     <Card className="p-6 border border-divider bg-background/50 backdrop-blur-md rounded-2xl flex flex-col justify-start">
//                         <div className="flex flex-col gap-4 mb-6">
//                             <h3 className="text-lg font-bold flex items-center gap-2">
//                                 <TbInfoCircle className="text-[#00b4d8] size-5" />
//                                 Lịch sử điểm danh
//                             </h3>
//                             <select
//                                 value={selectedMonthId}
//                                 onChange={(e) => setSelectedMonthId(e.target.value)}
//                                 className="w-full rounded-xl border border-divider bg-content1 px-3 py-2 text-sm font-semibold text-foreground focus:outline-none focus:border-primary"
//                             >
//                                 {.map((m) => (
//                                     <option key={m.id} value={m.id}>
//                                         Tháng {m.month} - Năm {m.year}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>
//                         <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
//                             {isLoading ? (
//                                 <p className="text-xs text-muted-foreground">Đang tải lịch sử điểm danh...</p>
//                             ) : attendanceLogs.length === 0 ? (
//                                 <p className="text-xs text-muted-foreground">Chưa có lịch sử điểm danh trong tháng này.</p>
//                             ) : (
//                                 attendanceLogs.map((log, idx) => (
//                                     <div key={idx} className="flex items-center justify-between p-3 border border-divider/60 rounded-xl bg-content1/20">
//                                         <div>
//                                             <p className="text-sm font-semibold">{formatDateTime(log.date)}</p>
//                                             <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
//                                                 <TbClock className="size-3.5" /> {log.startTime} - {log.endTime}
//                                             </p>
//                                         </div>
//                                         <Chip
//                                             size="sm"
//                                             className={
//                                                 log.attendanceStatus === "Present"
//                                                     ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
//                                                     : log.attendanceStatus === "Absent"
//                                                         ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold"
//                                                         : log.attendanceStatus === "Late"
//                                                             ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 font-semibold"
//                                                             : log.attendanceStatus === "Excused"
//                                                                 ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 font-semibold"
//                                                                 : "bg-content3/30 text-foreground font-semibold"
//                                             }
//                                         >
//                                             {log.attendanceStatus === "Present" ? "Có mặt" : log.attendanceStatus === "Absent" ? "Vắng mặt" : log.attendanceStatus === "Late" ? "Trễ" : log.attendanceStatus === "Excused" ? "Vắng có phép" : "Không rõ"}
//                                         </Chip>
//                                     </div>
//                                 ))
//                             )}
//                         </div>
//                     </Card>
//                 </div>
//             </div>
//         </div>
//     );
// }
