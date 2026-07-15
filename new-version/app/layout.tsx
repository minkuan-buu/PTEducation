import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { cookies } from "next/headers";
import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";
import { FloatingThemeSwitch } from "@/components/floating-theme-switch";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_collapsed")?.value === "true";
  const userRole = cookieStore.get("user_role")?.value || null;
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        suppressHydrationWarning
        className={clsx(
          "min-h-screen max-w-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers
          initialCollapsed={isCollapsed}
          initialRole={userRole}
          themeProps={{
            attribute: "class",
            defaultTheme: "dark",
            enableSystem: false,
          }}
        >
          <div className="relative flex flex-col min-h-screen">
            {/* <Navbar /> */}
            <main className="flex-grow w-full">
              {children}
            </main>
            {/* <FloatingThemeSwitch /> */}
            {/* <footer className="w-full flex items-center justify-center py-3">
              <a
                className="flex items-center gap-1 text-current no-underline"
                href="https://heroui.com?utm_source=next-app-template"
                rel="noopener noreferrer"
                target="_blank"
              >
                <span className="text-muted">Powered by</span>
                <p className="text-accent">HeroUI</p>
              </a>
            </footer> */}
          </div>
        </Providers>
      </body>
    </html>
  );
}
