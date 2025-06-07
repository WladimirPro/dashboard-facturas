"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type ColorBlindType = "none" | "protanopia" | "deuteranopia" | "tritanopia"

interface AccessibilityContextType {
  colorBlindMode: ColorBlindType
  setColorBlindMode: (mode: ColorBlindType) => void
  isLoaded: boolean
}

const AccessibilityContext = createContext<AccessibilityContextType>({
  colorBlindMode: "none",
  setColorBlindMode: () => {},
  isLoaded: false,
})

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [colorBlindMode, setColorBlindMode] = useState<ColorBlindType>("none")
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedMode = localStorage.getItem("colorBlindMode") as ColorBlindType
        if (savedMode && ["none", "protanopia", "deuteranopia", "tritanopia"].includes(savedMode)) {
          setColorBlindMode(savedMode)
          console.log("Modo cargado desde localStorage:", savedMode)
        }
      } catch (error) {
        console.error("Error cargando configuración:", error)
      }
      setIsLoaded(true)
    }
  }, [])

  const updateColorBlindMode = (mode: ColorBlindType) => {
    console.log("Actualizando modo daltonismo:", mode)
    setColorBlindMode(mode)

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("colorBlindMode", mode)

        // Remover todas las clases
        document.documentElement.classList.remove(
          "colorblind-protanopia",
          "colorblind-deuteranopia",
          "colorblind-tritanopia",
        )

        // Añadir la nueva clase si no es "none"
        if (mode !== "none") {
          document.documentElement.classList.add(`colorblind-${mode}`)
          console.log("Clase aplicada:", `colorblind-${mode}`)
        }
      } catch (error) {
        console.error("Error guardando configuración:", error)
      }
    }
  }

  useEffect(() => {
    if (isLoaded) {
      updateColorBlindMode(colorBlindMode)
    }
  }, [isLoaded])

  return (
    <AccessibilityContext.Provider
      value={{
        colorBlindMode,
        setColorBlindMode: updateColorBlindMode,
        isLoaded,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  return useContext(AccessibilityContext)
}
