"use client"

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"

export function SidebarHeaderTrigger() {
  const { isMobile, open, openMobile } = useSidebar()
  const shouldShowTrigger = isMobile ? !openMobile : !open

  if (!shouldShowTrigger) {
    return null
  }

  return (
    <>
      <SidebarTrigger className="-ml-1" />
      <div className="mx-2 h-6 w-px bg-border" />
    </>
  )
}
