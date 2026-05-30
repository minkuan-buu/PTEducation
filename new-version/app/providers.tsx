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

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const hasNotifiedRef = React.useRef(false);
  const logoutInFlightRef = React.useRef<Promise<void> | null>(null);

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
