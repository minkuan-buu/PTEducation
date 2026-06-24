"use client";

import type { ThemeProviderProps } from "next-themes";
import { useRouter } from "next/navigation";
import { Toast, toast } from "@heroui/react";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AttendanceProvider } from "@/context/attendance-context";
import { UserProvider } from "@/context/user-context";
import { TanStackProvider } from "@/providers/tanstack-provider";
import { setUnauthorizedHandler, v2 } from "@/services/api";

if (typeof window !== "undefined") {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("Encountered a script tag while rendering React component")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const hasNotifiedRef = React.useRef(false);
  const logoutInFlightRef = React.useRef<Promise<void> | null>(null);

  React.useEffect(() => {
    const handleUnhandledRejection = (event: any) => {
      const reason = event.reason;
      if (
        reason &&
        typeof reason === "object" &&
        "message" in reason &&
        typeof reason.message === "string" &&
        (reason.message.includes("Skipped ViewTransition") ||
          reason.message.includes("view transition") ||
          reason.message.includes("ViewTransition"))
      ) {
        event.preventDefault();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("unhandledrejection", handleUnhandledRejection);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      }
    };
  }, []);

  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      if (typeof window === "undefined") {
        return;
      }

      const nextPath = `${window.location.pathname}${window.location.search}`;
      const safeNext =
        nextPath.startsWith("/") && !nextPath.startsWith("//")
          ? nextPath
          : "/";

      if (!logoutInFlightRef.current) {
        logoutInFlightRef.current = v2
          .logout()
          .then(() => undefined)
          .catch(() => undefined)
          .finally(() => {
            logoutInFlightRef.current = null;
          });
      }

      if (!hasNotifiedRef.current) {
        toast.danger("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        hasNotifiedRef.current = true;
      }

      if (safeNext.startsWith("/auth")) {
        router.replace("/auth");
        return;
      }

      router.replace(`/auth?next=${encodeURIComponent(safeNext)}`);
    });

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [router]);

  return (
    <NextThemesProvider {...themeProps}>
      <TanStackProvider>
        <UserProvider>
          <AttendanceProvider>
            <Toast.Provider placement="bottom end" />
            {children}
          </AttendanceProvider>
        </UserProvider>
      </TanStackProvider>
    </NextThemesProvider>
  );
}
