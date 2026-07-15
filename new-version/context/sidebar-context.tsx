"use client";

import * as React from "react";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({
  children,
  initialCollapsed = false,
}: {
  children: React.ReactNode;
  initialCollapsed?: boolean;
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(initialCollapsed);

  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const nextValue = !prev;
      try {
        // Persist setting in client cookies (expires in 1 year)
        document.cookie = `sidebar_collapsed=${nextValue}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      } catch (e) {
        console.error("Failed to save sidebar state to cookies:", e);
      }
      return nextValue;
    });
  }, []);

  const value = React.useMemo(
    () => ({
      isCollapsed,
      toggleSidebar,
    }),
    [isCollapsed, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
