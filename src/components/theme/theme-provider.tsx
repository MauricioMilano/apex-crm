"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

type ThemeContext = "dashboard" | "portal"

interface ThemeContextValue {
  context: ThemeContext
  isDark: boolean
  toggle: () => void
}

const ThemeCtx = createContext<ThemeContextValue | null>(null)

function getStored(context: ThemeContext): boolean | null {
  try {
    const val = localStorage.getItem(`theme:${context}`)
    if (val === "dark") return true
    if (val === "light") return false
    return null
  } catch {
    return null
  }
}

function setStored(context: ThemeContext, isDark: boolean) {
  try {
    localStorage.setItem(`theme:${context}`, isDark ? "dark" : "light")
  } catch {
    // best-effort
  }
}

function applyTheme(context: ThemeContext, isDark: boolean) {
  const html = document.documentElement
  html.setAttribute("data-theme", context)
  const variantClass =
    context === "dashboard"
      ? "dashboard-light"
      : "portal-dark"
  if (isDark) {
    html.classList.remove(variantClass)
  } else {
    html.classList.add(variantClass)
  }
}

const DEFAULT_DARK: Record<ThemeContext, boolean> = {
  dashboard: true,
  portal: false,
}

export function ThemeProvider({
  context,
  children,
}: {
  context: ThemeContext
  children: React.ReactNode
}) {
  const [isDark, setIsDark] = useState<boolean>(DEFAULT_DARK[context])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = getStored(context)
    const initial = stored ?? DEFAULT_DARK[context]
    setIsDark(initial)
    applyTheme(context, initial)
    setMounted(true)
  }, [context])

  const toggle = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev
      applyTheme(context, next)
      setStored(context, next)
      return next
    })
  }, [context])

  if (!mounted) {
    return (
      <ThemeCtx.Provider value={{ context, isDark: DEFAULT_DARK[context], toggle }}>
        {children}
      </ThemeCtx.Provider>
    )
  }

  return (
    <ThemeCtx.Provider value={{ context, isDark, toggle }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider")
  return ctx
}
