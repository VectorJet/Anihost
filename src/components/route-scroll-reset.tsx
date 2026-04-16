"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function resetScrollPosition() {
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  const scrollingElement = document.scrollingElement as HTMLElement | null;
  if (scrollingElement) {
    scrollingElement.scrollTop = 0;
    scrollingElement.scrollLeft = 0;
  }

  const sidebarInset = document.querySelector<HTMLElement>('[data-slot="sidebar-inset"]');
  if (sidebarInset) {
    sidebarInset.scrollTop = 0;
    sidebarInset.scrollLeft = 0;
  }
}

export function RouteScrollReset() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (!("scrollRestoration" in window.history)) {
      return;
    }

    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    // Run repeatedly for a short window to override delayed framework/browser restoration.
    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      resetScrollPosition();
      secondFrame = window.requestAnimationFrame(resetScrollPosition);
    });
    const fallbackTimeout = window.setTimeout(resetScrollPosition, 120);
    const lockInterval = window.setInterval(resetScrollPosition, 50);
    const stopLockTimeout = window.setTimeout(() => {
      window.clearInterval(lockInterval);
    }, 1200);

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(fallbackTimeout);
      window.clearInterval(lockInterval);
      window.clearTimeout(stopLockTimeout);
    };
  }, [pathname, search]);

  return null;
}
