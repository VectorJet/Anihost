"use client"

import { motion } from "framer-motion"
import { Sun, Moon, Monitor } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useRef, useCallback } from "react"
import { flushSync } from "react-dom"

interface ThemeSwitcherProps {
  value: "light" | "dark" | "system"
  onChange: (theme: "light" | "dark" | "system") => void
  className?: string
  duration?: number
}

export function ThemeSwitcher({ value, onChange, className, duration = 400 }: ThemeSwitcherProps) {
  const { setTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  const themes = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const

  const handleThemeChange = useCallback(async (newTheme: "light" | "dark" | "system", event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget

    // Check if View Transition API is supported
    if (!document.startViewTransition) {
      onChange(newTheme)
      setTheme(newTheme)
      return
    }

    await document.startViewTransition(() => {
      flushSync(() => {
        onChange(newTheme)
        setTheme(newTheme)
      })
    }).ready

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2
    const maxRadius = Math.hypot(
      Math.max(left, window.innerWidth - left),
      Math.max(top, window.innerHeight - top)
    )

    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    )
  }, [onChange, setTheme, duration])

  return (
    <div className={cn("flex flex-col items-center gap-3", className)} ref={containerRef}>
      <div className="inline-flex items-center gap-1.5 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-full">
        {themes.map((theme) => {
          const Icon = theme.icon
          return (
            <button
              key={theme.id}
              onClick={(e) => handleThemeChange(theme.id, e)}
              className={cn(
                "relative p-2 rounded-full transition-colors",
                "hover:text-neutral-900 dark:hover:text-neutral-100",
                value === theme.id
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
              )}
              title={theme.label}
            >
              {value === theme.id && (
                <motion.div
                  layoutId="theme-indicator"
                  className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-full shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 35,
                  }}
                />
              )}
              <Icon className="relative z-10 size-4" />
            </button>
          )
        })}
      </div>
      <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
        {themes.find(t => t.id === value)?.label}
      </p>
    </div>
  )
}
