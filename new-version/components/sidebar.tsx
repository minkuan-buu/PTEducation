"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Skeleton, Tooltip, Avatar, buttonVariants } from "@heroui/react";
import { useSidebar } from "@/context/sidebar-context";

import { useAttendanceRealtime } from "@/context/attendance-context";
import { useChatRealtime } from "@/context/chat-context";
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
    TbLogout2,
    TbReceipt2,
    TbMessage,
    TbChevronLeft,
    TbChevronRight
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
    const { isCollapsed, toggleSidebar } = useSidebar();
    const { user, isAuthenticated, clearUser, isLoading } = useUser();
    const attendanceRealtime = useAttendanceRealtime();
    const { totalUnreadCount } = useChatRealtime();
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
                        { label: "Trò chuyện", href: "/chat", icon: TbMessage },
                    ],
                },
                {
                    title: "Quản lý",
                    items: [
                        { label: "Người dùng", href: "/users", icon: TbUsers },
                        { label: "Lớp học", href: "/classes", icon: TbSchool },
                        { label: "Học phí", href: "/tuitions", icon: TbReceipt2 },
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
                        { label: "Trò chuyện", href: "/chat", icon: TbMessage },
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
                        { label: "Trò chuyện", href: "/chat", icon: TbMessage },
                    ],
                },
            ],
            manager: [
                {
                    title: "",
                    items: [
                        { label: "Trang tổng quan", href: "/", icon: TbLayoutDashboard },
                        { label: "Trò chuyện", href: "/chat", icon: TbMessage },
                    ],
                },
                {
                    title: "Quản lý",
                    items: [
                        { label: "Người dùng", href: "/users", icon: TbUsers },
                        { label: "Lớp học", href: "/classes", icon: TbSchool },
                        { label: "Học phí", href: "/tuitions", icon: TbReceipt2 },
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
        <aside className={`fixed left-0 top-0 z-50 h-screen border-r border-separator bg-background/95 backdrop-blur-md flex flex-col transition-all duration-300 ${isCollapsed ? "w-20" : "w-64"}`}>
            <div className={`flex items-center shrink-0 transition-all duration-300 ${isCollapsed ? "flex-col py-4 gap-3 justify-center w-20 h-auto" : "h-18 justify-between px-6 w-64"}`}>
                {!isCollapsed ? (
                    <div className="flex flex-col">
                        <p className="font-bold text-inherit">PTEducation</p>
                        <span className="text-xs text-muted">Biological Sciences</span>
                    </div>
                ) : null}
                <div className={`flex items-center gap-2 ${isCollapsed ? "flex-col-reverse" : "flex-row"}`}>
                    <ThemeSwitch />
                    <Button
                        isIconOnly
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:bg-content2 hover:text-foreground transition-all duration-200 rounded-xl"
                        onPress={toggleSidebar}
                        aria-label={isCollapsed ? "Mở rộng" : "Thu gọn"}
                    >
                        {isCollapsed ? <TbChevronRight className="size-4" /> : <TbChevronLeft className="size-4" />}
                    </Button>
                </div>
            </div>

            <div className="border-t border-divider/60" />

            <div className={`flex-1 overflow-y-auto custom-scrollbar py-4 space-y-5 transition-all duration-300 ${isCollapsed ? "px-2" : "px-3"}`}>
                {!isCollapsed && (
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
                    </div>
                )}

                <div className="flex justify-center transition-all duration-300">
                    {isLoading ? (
                        isCollapsed ? (
                            <Skeleton className="size-10 rounded-full" />
                        ) : (
                            <div className="w-full rounded-xl px-3 py-3 border border-divider/60 bg-content2/50 flex flex-row gap-4 items-center">
                                <Skeleton className="size-10 rounded-full" />
                                <div className="flex flex-col gap-2 flex-1">
                                    <Skeleton className="h-4 w-2/3 rounded-lg" />
                                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                                </div>
                            </div>
                        )
                    ) : isCollapsed ? (
                        <Tooltip delay={0}>
                            <div className="cursor-pointer" onClick={() => router.push("/profile")}>
                                <Avatar size="md">
                                    {user?.avatarUrl ? (
                                        <Avatar.Image
                                            alt={user.name || "User"}
                                            src={user.avatarUrl}
                                        />
                                    ) : null}
                                    <Avatar.Fallback className="border-none bg-gradient-to-br from-[#00b4d8] to-[#90e0ef] text-white text-xs">
                                        {(user?.name || "User").split(" ").map((part) => part[0]).join("").slice(-2).toUpperCase()}
                                    </Avatar.Fallback>
                                </Avatar>
                            </div>
                            <Tooltip.Content placement="right">
                                <p>{`${user?.name || "User"} (${user?.role?.toLocaleLowerCase() === "guardian" ? "Phụ huynh" : user?.role?.toLocaleLowerCase() === "admin" ? "Quản trị viên" : user?.role?.toLocaleLowerCase() === "manager" ? "Quản lý" : "Học sinh"})`}</p>
                            </Tooltip.Content>
                        </Tooltip>
                    ) : (
                        <UserCard name={user?.name || "User"} role={user?.role?.toLocaleLowerCase() === "guardian" ? "Phụ huynh" : user?.role?.toLocaleLowerCase() === "admin" ? "Quản trị viên" : user?.role?.toLocaleLowerCase() === "manager" ? "Quản lý" : "Học sinh"} avatarUrl={user?.avatarUrl || ""} />
                    )}
                </div>

                <nav className="py-2">
                    <div className="flex flex-col gap-5">
                        {sections.map((section, secIdx) => (
                            <div key={section.title || secIdx} className="flex flex-col gap-2">
                                {section.title && (
                                    !isCollapsed ? (
                                        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                            {section.title}
                                        </p>
                                    ) : (
                                        <div className="border-t border-divider/40 mx-2 my-1" />
                                    )
                                )}
                                <div className="flex flex-col gap-1">
                                    {section.items.map((item) => {
                                        const isActive =
                                            item.href === "/"
                                                ? pathname === "/"
                                                : pathname === item.href || pathname.startsWith(`${item.href}/`);

                                        const Icon = item.icon;

                                        const buttonClass = isActive
                                            ? "group w-full h-11 rounded-xl text-sm font-semibold text-white bg-gradient-to-tr from-[#48cae4] to-[#00b4d8] shadow-md shadow-[#00b4d8]/20 transition-all duration-300 transform scale-[1.01] flex items-center"
                                            : "group w-full h-11 rounded-xl text-sm font-medium text-foreground hover:bg-content2 hover:text-foreground transition-all duration-200 flex items-center";

                                        const buttonContent = (
                                            <div
                                                className={`${buttonClass} ${isCollapsed ? "justify-center px-0" : "justify-start px-4 gap-3"} w-full cursor-pointer h-11`}
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <Icon className="size-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                                    {isCollapsed && item.href === "/chat" && totalUnreadCount > 0 && (
                                                        <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center size-4 rounded-full text-[8px] font-bold text-white bg-red-500 shadow-sm animate-pulse">
                                                            {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                                {!isCollapsed && <span>{item.label}</span>}
                                                {!isCollapsed && item.href === "/chat" && totalUnreadCount > 0 && (
                                                    <span className="ml-auto flex items-center justify-center size-5 rounded-full text-[10px] font-bold text-white bg-red-500 shadow-sm animate-pulse">
                                                        {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        );

                                        return (
                                            <NextLink key={item.href} href={item.href} className="w-full flex justify-center no-underline">
                                                {isCollapsed ? (
                                                    <Tooltip delay={0}>
                                                        <div className="w-full px-2 flex justify-center">{buttonContent}</div>
                                                        <Tooltip.Content placement="right">
                                                            <p>{item.label}</p>
                                                        </Tooltip.Content>
                                                    </Tooltip>
                                                ) : (
                                                    buttonContent
                                                )}
                                            </NextLink>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </nav>
            </div>
            <div className={`mt-auto border-t border-divider shrink-0 bg-background/95 transition-all duration-300 ${isCollapsed ? "p-2" : "p-4"}`}>
                <div className="flex flex-col gap-2">
                    {isCollapsed ? (
                        <Tooltip delay={0}>
                            <div className="w-full flex justify-center">
                                <a
                                    href="https://pteducation.edu.vn/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`${buttonVariants({
                                        variant: "secondary",
                                        size: "lg",
                                        isIconOnly: true,
                                    })} rounded-xl`}
                                >
                                    <OpenIcon height="1.2em" />
                                </a>
                            </div>
                            <Tooltip.Content placement="right">
                                <p>Truy cập E-Learning</p>
                            </Tooltip.Content>
                        </Tooltip>
                    ) : (
                        <a
                            href="https://pteducation.edu.vn/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${buttonVariants({
                                variant: "secondary",
                                size: "lg",
                                fullWidth: true,
                            })} w-full justify-start rounded-xl px-3 py-2 text-md font-medium`}
                        >
                            <OpenIcon height="1em" />
                            Truy cập E-Learning
                        </a>
                    )}

                    {isCollapsed ? (
                        <Tooltip delay={0}>
                            <div className="w-full flex justify-center">
                                <Button
                                    size="lg"
                                    isIconOnly
                                    className="rounded-xl"
                                    onPress={handleLogout}
                                    variant="danger-soft"
                                >
                                    <TbLogout2 className="size-5" />
                                </Button>
                            </div>
                            <Tooltip.Content placement="right">
                                <p>Đăng xuất</p>
                            </Tooltip.Content>
                        </Tooltip>
                    ) : (
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
                    )}
                </div>
            </div>
        </aside>
    );
};
