"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { MoonFilledIcon, SunFilledIcon } from "@/components/icons";

export function FloatingThemeSwitch() {
    const { setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isLight = mounted ? resolvedTheme === "light" : false;

    return (
        <button
            aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
            className="fixed bottom-5 right-5 z-[9999] inline-flex h-12 w-12 items-center justify-center rounded-full border border-divider/70 bg-content1/85 text-foreground shadow-lg shadow-black/20 backdrop-blur-md transition-all hover:scale-105 hover:bg-content1"
            onClick={() => setTheme(isLight ? "dark" : "light")}
            type="button"
        >
            {isLight ? <SunFilledIcon size={20} /> : <MoonFilledIcon size={20} />}
        </button>
    );
}
