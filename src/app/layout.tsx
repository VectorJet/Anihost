import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SearchTrigger } from "@/components/search-trigger"
import { SidebarHeaderTrigger } from "@/components/sidebar-header-trigger"
import { getHomePageData, getMe } from "@/lib/api"
import { ThemeProvider } from "@/components/theme-provider"
import { Logo } from "@/components/logo"
import Link from "next/link"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const sfPro = localFont({
  src: [
    {
      path: "../fonts/SF-Pro-Display-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/SF-Pro-Display-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/SF-Pro-Display-Semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/SF-Pro-Display-Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sf-pro",
  fallback: ["-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Anihost",
  description: "Anihost - Your Anime Streaming Platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [homeData, user] = await Promise.all([
    getHomePageData(),
    getMe()
  ]);
  const genres = homeData.genres || [];

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sfPro.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <SidebarProvider>
            <AppSidebar genres={genres} user={user} />
            <SidebarInset>
              <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <SidebarHeaderTrigger />
                <Link href="/" className="flex items-center gap-1">
                  <Logo className="h-7 w-auto mb-1" />
                  <h1 className="text-xl font-bold tracking-tight">nihost</h1>
                </Link>
                <SearchTrigger />
              </header>
              {children}
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
