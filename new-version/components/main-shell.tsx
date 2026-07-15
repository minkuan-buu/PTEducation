"use client";

import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { PasswordReminder } from "@/components/password-reminder";
import { QuickChat } from "@/components/quick-chat";
import { useSidebar } from "@/context/sidebar-context";

type MainShellProps = {
    children: React.ReactNode;
};

export const MainShell = ({ children }: MainShellProps) => {
    const { isCollapsed } = useSidebar();

    return (
        <div className="flex min-h-screen flex-col">
            <Sidebar />
            {/* <Navbar isSidebarOpen /> */}
            <main className={`flex-grow w-full transition-all duration-300 ${isCollapsed ? "pl-20" : "pl-64"}`}>
                {children}
            </main>
            <PasswordReminder />
            <QuickChat />
        </div>
    );
};
