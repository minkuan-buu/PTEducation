"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Skeleton } from "@heroui/react";

import { useAttendanceRealtime } from "@/context/attendance-context";
import { useUser } from "@/context/user-context";
import { v2 } from "@/services/api";
import { UserCard } from "./user-sidebar-card";
import {
    TbLayoutDashboard,
    TbSchool,
    TbUsers,
    TbReport,
    TbCalendar,
    TbUserCheck,
    TbAward,
    TbClipboardCheck,
    TbReportAnalytics,
    TbLogout2
} from "react-icons/tb";
import NextLink from "next/link";
import OpenIcon from '@iconify-react/majesticons/open';
import { ThemeSwitch } from "./theme-switch";

function formatClock(date: Date) {
    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function formatDateLabel(date: Date) {
    return date.toLocaleDateString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

type MenuItem = {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
};

type MenuSection = {
    title: string;
    items: MenuItem[];
};

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, clearUser, isLoading } = useUser();
    const attendanceRealtime = useAttendanceRealtime();
    const [tick, setTick] = useState(() => new Date());
    const [isMounted, setIsMounted] = useState(false);

    const role = (user?.role ?? "null").toLowerCase();

    useEffect(() => {
        setIsMounted(true);

        const timerId = window.setInterval(() => {
            setTick(new Date());
        }, 1000);

        return () => window.clearInterval(timerId);
    }, []);

    const displayNow = useMemo(() => {
        if (!isMounted) {
            return null;
        }

        if (!attendanceRealtime.serverTime || !attendanceRealtime.serverTimeSyncedAt) {
            return tick;
        }

        const elapsedMs = tick.getTime() - attendanceRealtime.serverTimeSyncedAt.getTime();
        return new Date(attendanceRealtime.serverTime.getTime() + elapsedMs);
    }, [attendanceRealtime.serverTime, attendanceRealtime.serverTimeSyncedAt, isMounted, tick]);

    const connectionBadge = useMemo(() => {
        switch (attendanceRealtime.connectionStatus) {
            case "connected":
                return {
                    dotClass: "bg-emerald-500",
                    animateClass: "animate-ping",
                };
            case "connecting":
            case "reconnecting":
                return {
                    dotClass: "bg-amber-400",
                    animateClass: "",
                };
            case "error":
            case "disconnected":
                return {
                    dotClass: "bg-red-500",
                    animateClass: "",
                };
            default:
                return {
                    dotClass: "bg-zinc-400",
                    animateClass: "",
                };
        }
    }, [attendanceRealtime.connectionStatus]);

    const menuByRole: Record<string, MenuSection[]> = useMemo(
        () => ({
            admin: [
                {
                    title: "",
                    items: [
                        { label: "Trang tổng quan", href: "/", icon: TbLayoutDashboard },
                    ],
                },
                {
                    title: "Quản lý",
                    items: [
                        { label: "Người dùng", href: "/users", icon: TbUsers },
                        { label: "Lớp học", href: "/classes", icon: TbSchool },
                        // { label: "Báo cáo", href: "/reports", icon: TbReport },
                    ],
                },
            ],
            student: [
                {
                    title: "Cổng thông tin",
                    items: [
                        { label: "Tổng quan", href: "/", icon: TbLayoutDashboard },
                        { label: "Lịch học & Điểm danh", href: "/schedule", icon: TbCalendar },
                        { label: "Điểm số", href: "/grades", icon: TbAward },
                    ],
                },
            ],
            guardian: [
                {
                    title: "Cổng thông tin",
                    items: [
                        { label: "Tổng quan", href: "/", icon: TbLayoutDashboard },
                        { label: "Lịch học & Điểm danh", href: "/schedule", icon: TbCalendar },
                        { label: "Điểm số", href: "/grades", icon: TbAward },
                    ],
                },
            ],
            // manager: [
            //     {
            //         title: "Vận hành",
            //         items: [
            //             { label: "Tổng quan", href: "/", icon: TbLayoutDashboard },
            //             { label: "Lớp học", href: "/classes", icon: TbSchool },
            //             { label: "Lịch học", href: "/schedule", icon: TbCalendar },
            //         ],
            //     },
            //     {
            //         title: "Báo cáo",
            //         items: [
            //             { label: "Điểm danh", href: "/reports/attendance", icon: TbClipboardCheck },
            //             { label: "Điểm số", href: "/reports/scores", icon: TbReportAnalytics },
            //         ],
            //     },
            // ],
            null: []
        }),
        [],
    );

    const sections = menuByRole[role] ?? menuByRole.student ?? [];
    const firstItemHref = sections[0]?.items[0]?.href;

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!firstItemHref || firstItemHref === "/") return;
        if (pathname === "/") {
            router.replace(firstItemHref);
        }
    }, [firstItemHref, isAuthenticated, pathname, router]);

    async function handleLogout() {
        try {
            await v2.logout();
        } catch {
            // Ignore network errors on logout.
        } finally {
            clearUser();
            router.push("/auth");
        }
    }

    return (
        <aside className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-separator bg-background/95 backdrop-blur-md flex flex-col">
            <div className="flex h-18 items-center justify-between px-6 shrink-0">
                <div className="flex flex-col">
                    <p className="font-bold text-inherit">PTEducation</p>
                    <span className="text-xs text-muted">Biological Sciences</span>
                </div>
                <ThemeSwitch />
            </div>

            <div className="border-t border-divider/60" />

            <div className="flex-1 overflow-y-auto no-scrollbar py-4 space-y-5 px-3">
                <div className="rounded-2xl border border-divider bg-content1/80 p-4 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-divider/80">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            {/* <p className="text-xs uppercase tracking-wide text-muted">Đồng hồ hệ thống</p> */}
                            <p className="text-2xl font-semibold tabular-nums tracking-tight">{displayNow ? formatClock(displayNow) : "--:--:--"}</p>
                        </div>
                        <span
                            aria-label={attendanceRealtime.connectionStatus}
                            title={attendanceRealtime.connectionStatus}
                            className="relative inline-flex size-5 items-center justify-center"
                        >
                            {attendanceRealtime.connectionStatus === "connected" ? (
                                <>
                                    <span
                                        className={`absolute inline-block size-5 rounded-full ${connectionBadge.dotClass} opacity-20 ${connectionBadge.animateClass}`}
                                        style={{ animationDuration: "2.5s" }}
                                    />
                                    <span
                                        className={`absolute inline-block size-4 rounded-full ${connectionBadge.dotClass} opacity-35 ${connectionBadge.animateClass}`}
                                        style={{ animationDuration: "2.5s", animationDelay: "0.8s" }}
                                    />
                                </>
                            ) : null}
                            <span
                                className={`relative inline-block size-2.5 rounded-full ${connectionBadge.dotClass} shadow-[0_0_0_4px_rgba(255,255,255,0.08)]`}
                            />
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-muted">{displayNow ? formatDateLabel(displayNow) : "Đang tải giờ..."}</p>
                    {/* <p className="mt-1 text-xs text-muted">
                        {attendanceRealtime.serverTime ? "Đang sync giờ từ BE" : "Đang dùng giờ máy tạm thời"}
                    </p> */}
                </div>

                <div>
                    {isLoading ? (
                        <div className="w-full rounded-xl px-3 py-3 border border-divider/60 bg-content2/50 flex flex-row gap-4 items-center">
                            <Skeleton className="size-10 rounded-full" />
                            <div className="flex flex-col gap-2 flex-1">
                                <Skeleton className="h-4 w-2/3 rounded-lg" />
                                <Skeleton className="h-3 w-1/3 rounded-lg" />
                            </div>
                        </div>
                    ) : (
                        <UserCard name={user?.name || "User"} role={user?.role?.toLocaleLowerCase() === "guardian" ? "Phụ huynh" : user?.role?.toLocaleLowerCase() === "admin" ? "Quản trị" : user?.role?.toLocaleLowerCase() === "manager" ? "Quản lý" : "Học sinh"} avatarUrl={user?.avatarUrl || ""} />
                    )}
                </div>

                <nav className="py-2">
                    <div className="flex flex-col gap-5">
                        {sections.map((section) => (
                            <div key={section.title} className="flex flex-col gap-2">
                                {section.title && (
                                    <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                        {section.title}
                                    </p>
                                )}
                                <div className="flex flex-col gap-1">
                                    {section.items.map((item) => {
                                        const isActive =
                                            item.href === "/"
                                                ? pathname === "/"
                                                : pathname === item.href || pathname.startsWith(`${item.href}/`);

                                        const Icon = item.icon;

                                        return (
                                            <NextLink key={item.href} href={item.href} className="w-full">
                                                <Button
                                                    className={
                                                        isActive
                                                            ? "group w-full h-11 justify-start rounded-xl px-4 text-sm font-semibold text-white bg-gradient-to-tr from-[#48cae4] to-[#00b4d8] shadow-md shadow-[#00b4d8]/20 transition-all duration-300 transform scale-[1.01] flex items-center gap-3"
                                                            : "group w-full h-11 justify-start rounded-xl px-4 text-sm font-medium text-foreground hover:bg-content2 hover:text-foreground transition-all duration-200 flex items-center gap-3"
                                                    }
                                                    fullWidth
                                                    variant="ghost"
                                                >
                                                    <Icon className="size-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                                    <span>{item.label}</span>
                                                </Button>
                                            </NextLink>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>
            </div>
            <div className="absolute bottom-0 left-0 w-full border-t border-divider p-4">
                <div className="flex flex-col gap-2">
                    <NextLink className="flex items-center gap-1" href="https://pteducation.edu.vn/" target="_blank" rel="noopener noreferrer">
                        <Button
                            size="lg"
                            className="w-full justify-start rounded-xl px-3 py-2 text-md font-medium"
                            fullWidth
                            variant="secondary"
                        >
                            <OpenIcon height="1em" />
                            Truy cập E-Learning
                        </Button>
                    </NextLink>
                    <Button
                        size="lg"
                        className="w-full justify-start rounded-xl px-3 py-2 text-md font-medium"
                        fullWidth
                        onPress={handleLogout}
                        variant="danger-soft"
                    >
                        <TbLogout2 />
                        Đăng xuất
                    </Button>
                </div>
            </div>
        </aside>
    );
};
