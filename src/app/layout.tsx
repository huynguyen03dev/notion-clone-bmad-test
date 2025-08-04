import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PerformanceConfig } from "@/components/layout/animations/performance-config";
import { CollaborationProvider } from "@/components/collaboration/collaboration-provider";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kanban Board App",
  description: "A modern, collaborative kanban board application built with Next.js",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kanban Board"
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icon-152x152.png", sizes: "152x152", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          defaultTheme="system"
          storageKey="kanban-ui-theme"
        >
          <PerformanceConfig>
            <SessionProvider>
              <PWAProvider>
                <CollaborationProvider>
                  <AppShell>
                    {children}
                  </AppShell>
                  <Toaster />
                </CollaborationProvider>
              </PWAProvider>
            </SessionProvider>
          </PerformanceConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
