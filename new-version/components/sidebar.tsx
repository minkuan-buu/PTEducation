"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { useUser } from "@/context/user-context";
import { v2 } from "@/services/api";
import { UserCard } from "./user-sidebar-card";
import { TbLogout2 } from "react-icons/tb";
import NextLink from "next/link";
import OpenIcon from '@iconify-react/majesticons/open';
import { ThemeSwitch } from "./theme-switch";

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

    const role = (user?.role ?? "null").toLowerCase();
    console.log(user);

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
                                        <Button
                                            key={item.href}
                                            className={
                                                isActive
                                                    ? "w-full min-h-[7vh] justify-start rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary bg-gradient-to-tr from-[#48cae4] to-[#00b4d8]"
                                                    : "w-full min-h-[7vh] justify-start rounded-xl px-3 py-2 text-sm font-medium text-foreground"
                                            }
                                            fullWidth
                                            onPress={() => router.push(item.href)}
                                            variant="ghost"
                                        >
                                            {item.label}
                                        </Button>
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
