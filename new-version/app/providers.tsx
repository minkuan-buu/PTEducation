"use client";

import type { ThemeProviderProps } from "next-themes";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { UserProvider } from "@/context/user-context";
import { TanStackProvider } from "@/providers/tanstack-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  return (
    <NextThemesProvider {...themeProps}>
      <TanStackProvider>
        <UserProvider>{children}</UserProvider>
      </TanStackProvider>
    </NextThemesProvider>
  );
}
