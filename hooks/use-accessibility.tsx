"use client"

import { useState, useEffect } from "react"

export type ColorBlindType = "none" | "protanopia" | "deuteranopia" | "tritanopia"

export function useAccessibility() {
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindType>("none")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("colorBlindMode") as ColorBlindType
    if (saved && ["none", "protanopia", "deuteranopia", "tritanopia"].includes(saved)) {
      setColorBlindMode(saved)
    }
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("colorBlindMode", colorBlindMode)

      // Remover todas las clases de daltonismo
      document.documentElement.classList.remove(
        "colorblind-protanopia",
        "colorblind-deuteranopia",
        "colorblind-tritanopia",
      )

      // Agregar la clase correspondiente si no es "none"
      if (colorBlindMode !== "none") {
        document.documentElement.classList.add(`colorblind-${colorBlindMode}`)
      }
    }
  }, [colorBlindMode, mounted])

  return {
    colorBlindMode,
    setColorBlindMode,
    mounted,
  }
}
