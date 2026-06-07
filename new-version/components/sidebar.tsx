"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { useAttendanceRealtime } from "@/context/attendance-context";
import { useUser } from "@/context/user-context";
import { v2 } from "@/services/api";
import { UserCard } from "./user-sidebar-card";
import { TbLogout2 } from "react-icons/tb";
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
};

type MenuSection = {
    title: string;
    items: MenuItem[];
};

export const Sidebar = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, clearUser } = useUser();
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
                        { label: "Trang tổng quan", href: "/" },
                    ],
                },
                {
                    title: "Quản lý",
                    items: [
                        { label: "Người dùng", href: "/users" },
                        { label: "Lớp học", href: "/classes" },
                        { label: "Báo cáo", href: "/reports" },
                    ],
                },
            ],
            student: [
                {
                    title: "Classes",
                    items: [
                        { label: "Overview", href: "/" },
                        { label: "My Classes", href: "/classes" },
                        { label: "Grades & Attendance", href: "/grades" },
                    ],
                },
                {
                    title: "Schedule",
                    items: [
                        { label: "Calendar", href: "/schedule" },
                    ],
                },
            ],
            guardian: [
                {
                    title: "Student",
                    items: [
                        { label: "Overview", href: "/" },
                        { label: "Attendance", href: "/attendance" },
                        { label: "Grades", href: "/grades" },
                    ],
                },
            ],
            manager: [
                {
                    title: "Operations",
                    items: [
                        { label: "Overview", href: "/" },
                        { label: "Classes", href: "/classes" },
                        { label: "Schedule", href: "/schedule" },
                    ],
                },
                {
                    title: "Reports",
                    items: [
                        { label: "Attendance", href: "/reports/attendance" },
                        { label: "Scores", href: "/reports/scores" },
                    ],
                },
            ],
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
        <aside className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-separator bg-background/95 backdrop-blur-md">
            <div className="flex h-18 items-center justify-between px-6">
                <div className="flex flex-col">
                    <p className="font-bold text-inherit">PTEducation</p>
                    <span className="text-xs text-muted">Biological Sciences</span>
                </div>
                <ThemeSwitch />
            </div>
            <div className="space-y-4 border-t border-divider pt-4" />
            <div className="px-3 pb-3">
                <div className="rounded-2xl border border-divider bg-content1/80 p-4 shadow-sm backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                        <div>
                            {/* <p className="text-xs uppercase tracking-wide text-muted">Đồng hồ hệ thống</p> */}
                            <p className="text-2xl font-semibold tabular-nums">{displayNow ? formatClock(displayNow) : "--:--:--"}</p>
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
            </div>
            <div className="px-3">
                <UserCard name={user?.name || "User"} role={user?.role || "User"} avatarUrl={user?.avatarUrl || ""} />
            </div>

            <nav className="px-3 py-4">
                <div className="flex flex-col gap-4">
                    {sections.map((section) => (
                        <div key={section.title} className="flex flex-col gap-2">
                            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted">
                                {section.title}
                            </p>
                            <div className="flex flex-col gap-1">
                                {section.items.map((item) => {
                                    const isActive =
                                        item.href === "/"
                                            ? pathname === "/"
                                            : pathname === item.href || pathname.startsWith(`${item.href}/`);

                                    return (
                                        <NextLink key={item.href} href={item.href} className="w-full">
                                            <Button
                                                className={
                                                    isActive
                                                        ? "w-full min-h-[7vh] justify-start rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary bg-gradient-to-tr from-[#48cae4] to-[#00b4d8]"
                                                        : "w-full min-h-[7vh] justify-start rounded-xl px-3 py-2 text-sm font-medium text-foreground"
                                                }
                                                fullWidth
                                                variant="ghost"
                                            >
                                                {item.label}
                                            </Button>
                                        </NextLink>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </nav>
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
