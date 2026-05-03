import { FloatingThemeSwitch } from "@/components/floating-theme-switch";
import { Navbar } from "@/components/navbar";

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-grow w-full">
                {children}
            </main>
            <FloatingThemeSwitch />
        </div>
    );
}
