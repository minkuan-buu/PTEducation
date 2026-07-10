import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { PasswordReminder } from "@/components/password-reminder";
import { QuickChat } from "@/components/quick-chat";

type MainShellProps = {
    children: React.ReactNode;
};

export const MainShell = ({ children }: MainShellProps) => {
    return (
        <div className="flex min-h-screen flex-col">
            <Sidebar />
            {/* <Navbar isSidebarOpen /> */}
            <main className="flex-grow w-full pl-72">{children}</main>
            <PasswordReminder />
            <QuickChat />
        </div>
    );
};
