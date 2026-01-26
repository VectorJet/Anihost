import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SearchTrigger } from "@/components/search-trigger"
import { getHomePageData, getMe } from "@/lib/api"
import { ThemeProvider } from "@/components/theme-provider"

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <SidebarProvider>
            <AppSidebar genres={genres} user={user} />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <div className="w-px h-6 bg-border mx-2" />
                <h1 className="text-lg font-bold">Anihost</h1>
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
