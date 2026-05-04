"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@heroui/react";

import { useUser } from "@/context/user-context";

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
    const { user, isAuthenticated } = useUser();

    const role = user?.role ?? "student";
    console.log(isAuthenticated);

    const menuByRole: Record<string, MenuSection[]> = useMemo(
        () => ({
            admin: [
                {
                    title: "Overview",
                    items: [
                        { label: "Dashboard", href: "/" },
                    ],
                },
                {
                    title: "Management",
                    items: [
                        { label: "Users", href: "/users" },
                        { label: "Classes", href: "/classes" },
                        { label: "Reports", href: "/reports" },
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
        }),
        [],
    );

    const sections = menuByRole[role] ?? menuByRole.student;
    const firstItemHref = sections[0]?.items[0]?.href;

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!firstItemHref || firstItemHref === "/") return;
        if (pathname === "/") {
            router.replace(firstItemHref);
        }
    }, [firstItemHref, isAuthenticated, pathname, router]);

    return (
        <aside className="fixed left-0 top-0 z-50 h-screen w-72 border-r border-separator bg-background/95 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4">
                <div className="flex flex-col">
                    <p className="font-bold text-inherit">PTEducation</p>
                    <span className="text-xs text-muted">Biological Sciences</span>
                </div>
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
                                    const isActive = pathname === item.href;

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
        </aside>
    );
};
