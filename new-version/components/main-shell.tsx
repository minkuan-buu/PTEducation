import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";

type MainShellProps = {
    children: React.ReactNode;
};

export const MainShell = ({ children }: MainShellProps) => {
    return (
        <div className="flex min-h-screen flex-col">
            <Sidebar />
            <Navbar isSidebarOpen />
            <main className="flex-grow w-full">{children}</main>
        </div>
    );
};
